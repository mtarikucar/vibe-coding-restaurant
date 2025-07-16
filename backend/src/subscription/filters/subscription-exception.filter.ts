import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  ForbiddenException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(ForbiddenException)
export class SubscriptionExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SubscriptionExceptionFilter.name);

  catch(exception: ForbiddenException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const message = exception.message;
    const isSubscriptionRelated = 
      message.includes('subscription') || 
      message.includes('plan') || 
      message.includes('trial') ||
      message.includes('feature');

    if (isSubscriptionRelated) {
      this.logger.warn(`Subscription access denied: ${message} for ${request.url}`);

      // Enhanced error response for subscription-related issues
      const errorResponse = {
        statusCode: HttpStatus.FORBIDDEN,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        error: 'Subscription Required',
        message,
        subscriptionInfo: {
          currentStatus: request.subscriptionStatus,
          upgradeRequired: true,
          availablePlans: [
            {
              name: 'Monthly Plan',
              price: 29.99,
              currency: 'USD',
              features: ['Unlimited tables', 'Up to 10 users', 'Email support', 'Basic analytics'],
            },
            {
              name: 'Yearly Plan',
              price: 299.99,
              currency: 'USD',
              features: ['Unlimited tables', 'Up to 20 users', 'Priority support', 'Advanced analytics'],
            },
            {
              name: 'Enterprise Plan',
              price: 'Custom',
              currency: 'USD',
              features: ['Unlimited everything', '24/7 support', 'Premium analytics', 'Custom integrations'],
            },
          ],
        },
      };

      response.status(HttpStatus.FORBIDDEN).json(errorResponse);
    } else {
      // Handle other forbidden exceptions normally
      response.status(HttpStatus.FORBIDDEN).json({
        statusCode: HttpStatus.FORBIDDEN,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message,
      });
    }
  }
}