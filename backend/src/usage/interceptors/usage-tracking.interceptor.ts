import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { UsageTrackingService } from '../services/usage-tracking.service';
import { TRACK_USAGE_KEY, UsageTrackingConfig } from '../decorators/track-usage.decorator';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UsageTrackingInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const trackingConfig = this.reflector.getAllAndOverride<UsageTrackingConfig>(
      TRACK_USAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!trackingConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap((responseData) => {
        try {
          this.trackUsage(request, response, responseData, trackingConfig);
        } catch (error) {
          this.logger.error(`Failed to track usage: ${error.message}`, error.stack);
        }
      }),
    );
  }

  private async trackUsage(
    request: Request,
    response: Response,
    responseData: any,
    config: UsageTrackingConfig,
  ): Promise<void> {
    const user = request.user as any;
    const tenantId = user?.tenant?.id;
    const userId = user?.id;

    if (!tenantId || !userId) {
      this.logger.warn('Cannot track usage: tenant or user not found');
      return;
    }

    // Check condition if provided
    if (config.condition && !config.condition(request, response)) {
      return;
    }

    // Calculate value to track
    let value = config.value || 1;

    if (config.extractFromResponse && responseData) {
      value = this.extractValueFromObject(responseData, config.extractFromResponse) || value;
    }

    if (config.extractFromBody && request.body) {
      value = this.extractValueFromObject(request.body, config.extractFromBody) || value;
    }

    // Generate metadata
    let metadata = config.metadata;
    if (typeof metadata === 'function') {
      metadata = metadata(request, response);
    }

    // Add default metadata
    const finalMetadata = {
      endpoint: request.url,
      method: request.method,
      statusCode: response.statusCode,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    // Track the metric
    await this.usageTrackingService.trackMetric(
      tenantId,
      userId,
      config.metricType,
      value,
      finalMetadata,
    );

    this.logger.debug(
      `Tracked usage: ${config.metricType} = ${value} for tenant ${tenantId}`,
    );
  }

  private extractValueFromObject(obj: any, path: string): number | null {
    try {
      const pathParts = path.split('.');
      let current = obj;

      for (const part of pathParts) {
        if (current === null || current === undefined) {
          return null;
        }
        current = current[part];
      }

      // Convert to number if possible
      const numValue = Number(current);
      return isNaN(numValue) ? null : numValue;
    } catch (error) {
      this.logger.warn(`Failed to extract value from path ${path}: ${error.message}`);
      return null;
    }
  }
}