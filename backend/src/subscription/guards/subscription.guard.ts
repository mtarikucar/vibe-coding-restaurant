import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { User } from '../../auth/entities/user.entity';
import { SUBSCRIPTION_KEY } from '../decorators/subscription.decorator';

export interface SubscriptionRequirement {
  required?: boolean;
  allowTrial?: boolean;
  allowExpired?: boolean;
  minPlanType?: string;
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const subscriptionRequirement = this.reflector.getAllAndOverride<SubscriptionRequirement>(
      SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no subscription requirement is set, allow access
    if (!subscriptionRequirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User must be authenticated');
    }

    // If subscription is not required, allow access
    if (!subscriptionRequirement.required) {
      return true;
    }

    // Get user's current subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: user.id },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      throw new ForbiddenException('Active subscription required');
    }

    // Check subscription status
    const allowedStatuses = [SubscriptionStatus.ACTIVE];
    
    if (subscriptionRequirement.allowTrial) {
      allowedStatuses.push(SubscriptionStatus.TRIAL);
    }
    
    if (subscriptionRequirement.allowExpired) {
      allowedStatuses.push(SubscriptionStatus.EXPIRED);
    }

    if (!allowedStatuses.includes(subscription.status)) {
      throw new ForbiddenException(
        `Subscription status '${subscription.status}' is not allowed for this resource`
      );
    }

    // Check trial expiration
    if (subscription.status === SubscriptionStatus.TRIAL && subscription.endDate) {
      const now = new Date();
      if (subscription.endDate < now && !subscriptionRequirement.allowExpired) {
        throw new ForbiddenException('Trial period has expired');
      }
    }

    // Check minimum plan type if specified
    if (subscriptionRequirement.minPlanType && subscription.plan) {
      const planHierarchy = ['MONTHLY', 'YEARLY', 'ENTERPRISE'];
      const userPlanIndex = planHierarchy.indexOf(subscription.plan.type.toUpperCase());
      const requiredPlanIndex = planHierarchy.indexOf(subscriptionRequirement.minPlanType.toUpperCase());

      if (userPlanIndex === -1 || userPlanIndex < requiredPlanIndex) {
        throw new ForbiddenException(
          `This feature requires at least ${subscriptionRequirement.minPlanType} plan`
        );
      }
    }

    // Add subscription info to request for downstream use
    request.subscription = subscription;
    
    this.logger.log(`Subscription access granted for user ${user.id} with plan ${subscription.plan?.name}`);
    
    return true;
  }
}