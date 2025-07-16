import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { User } from '../../auth/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      subscription?: Subscription;
      subscriptionStatus?: {
        hasActiveSubscription: boolean;
        isTrialUser: boolean;
        daysUntilExpiry?: number;
        planName?: string;
        planType?: string;
        features?: Record<string, any>;
      };
    }
  }
}

@Injectable()
export class SubscriptionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SubscriptionMiddleware.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Only process if user is authenticated
      if (!req.user) {
        next();
        return;
      }

      const user = req.user as User;
      
      // Get user's current subscription
      const subscription = await this.subscriptionRepository.findOne({
        where: { userId: user.id },
        relations: ['plan'],
        order: { createdAt: 'DESC' },
      });

      if (subscription) {
        req.subscription = subscription;
        
        // Calculate subscription status
        const now = new Date();
        const isActive = subscription.status === SubscriptionStatus.ACTIVE;
        const isTrial = subscription.status === SubscriptionStatus.TRIAL;
        const isExpired = subscription.status === SubscriptionStatus.EXPIRED || 
                         (subscription.endDate && subscription.endDate < now);

        let daysUntilExpiry: number | undefined;
        if (subscription.endDate) {
          const diffTime = subscription.endDate.getTime() - now.getTime();
          daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else if (subscription.nextPaymentDate) {
          const diffTime = subscription.nextPaymentDate.getTime() - now.getTime();
          daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        req.subscriptionStatus = {
          hasActiveSubscription: isActive || (isTrial && !isExpired),
          isTrialUser: isTrial,
          daysUntilExpiry: daysUntilExpiry && daysUntilExpiry > 0 ? daysUntilExpiry : undefined,
          planName: subscription.plan?.name,
          planType: subscription.plan?.type,
          features: subscription.plan?.features,
        };

        // Add subscription headers for frontend consumption
        res.setHeader('X-Subscription-Status', subscription.status);
        res.setHeader('X-Subscription-Plan', subscription.plan?.name || 'unknown');
        res.setHeader('X-Has-Active-Subscription', req.subscriptionStatus.hasActiveSubscription.toString());
        
        if (daysUntilExpiry !== undefined) {
          res.setHeader('X-Days-Until-Expiry', daysUntilExpiry.toString());
        }

        this.logger.debug(`Subscription middleware processed for user ${user.id}: ${subscription.status}`);
      } else {
        // No subscription found
        req.subscriptionStatus = {
          hasActiveSubscription: false,
          isTrialUser: false,
        };

        res.setHeader('X-Subscription-Status', 'none');
        res.setHeader('X-Has-Active-Subscription', 'false');
      }
    } catch (error) {
      this.logger.error(`Error in subscription middleware: ${error.message}`, error.stack);
      // Continue processing even if middleware fails
    }

    next();
  }
}