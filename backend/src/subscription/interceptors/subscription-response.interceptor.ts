import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class SubscriptionResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SubscriptionResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    return next.handle().pipe(
      map((data) => {
        // If feature access info is available, include it in response
        if (request.featureAccess) {
          return {
            data,
            meta: {
              featureAccess: request.featureAccess,
              subscription: request.subscriptionStatus,
            },
          };
        }

        // If subscription status is available, include it in response metadata
        if (request.subscriptionStatus) {
          return {
            data,
            meta: {
              subscription: request.subscriptionStatus,
            },
          };
        }

        return data;
      }),
    );
  }
}