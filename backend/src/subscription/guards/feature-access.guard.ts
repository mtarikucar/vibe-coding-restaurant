import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { FEATURE_ACCESS_KEY } from '../decorators/feature-access.decorator';

export interface FeatureAccessRequirement {
  feature: string;
  description?: string;
  fallbackBehavior?: 'block' | 'limit' | 'degrade';
}

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  private readonly logger = new Logger(FeatureAccessGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureRequirement = this.reflector.getAllAndOverride<FeatureAccessRequirement>(
      FEATURE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no feature requirement is set, allow access
    if (!featureRequirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // For anonymous access, block premium features
      if (featureRequirement.fallbackBehavior === 'block') {
        throw new ForbiddenException(`Feature '${featureRequirement.feature}' requires subscription`);
      }
      return true;
    }

    // Get user's current subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId: user.id },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!subscription || subscription.status === SubscriptionStatus.EXPIRED) {
      if (featureRequirement.fallbackBehavior === 'block') {
        throw new ForbiddenException(`Feature '${featureRequirement.feature}' requires active subscription`);
      }
      
      // Add feature limitation info to request
      request.featureAccess = {
        hasAccess: false,
        feature: featureRequirement.feature,
        limitation: 'subscription_required',
        fallbackBehavior: featureRequirement.fallbackBehavior || 'limit',
      };
      
      return true;
    }

    // Check if plan includes the feature
    const hasFeatureAccess = this.checkFeatureAccess(subscription, featureRequirement.feature);

    if (!hasFeatureAccess) {
      if (featureRequirement.fallbackBehavior === 'block') {
        throw new ForbiddenException(
          `Feature '${featureRequirement.feature}' not available in your current plan`
        );
      }

      // Add feature limitation info to request
      request.featureAccess = {
        hasAccess: false,
        feature: featureRequirement.feature,
        limitation: 'plan_upgrade_required',
        currentPlan: subscription.plan?.name,
        fallbackBehavior: featureRequirement.fallbackBehavior || 'limit',
      };
      
      return true;
    }

    // Add feature access info to request
    request.featureAccess = {
      hasAccess: true,
      feature: featureRequirement.feature,
      currentPlan: subscription.plan?.name,
    };

    this.logger.log(`Feature access granted: ${featureRequirement.feature} for user ${user.id}`);
    
    return true;
  }

  private checkFeatureAccess(subscription: Subscription, feature: string): boolean {
    if (!subscription.plan?.features) {
      return false;
    }

    const features = subscription.plan.features;

    // Define feature access rules based on plan features
    const featureRules: Record<string, (features: any) => boolean> = {
      // Analytics features
      'advanced_analytics': (f) => f.analytics === 'advanced' || f.analytics === 'premium',
      'premium_analytics': (f) => f.analytics === 'premium',
      'real_time_analytics': (f) => f.analytics === 'advanced' || f.analytics === 'premium',
      
      // User management features
      'unlimited_users': (f) => f.users === 'unlimited' || parseInt(f.users) > 20,
      'user_roles': (f) => f.users !== 'up to 5',
      'team_management': (f) => f.users === 'unlimited' || parseInt(f.users) > 10,
      
      // Support features
      'priority_support': (f) => f.support === 'priority' || f.support === '24/7 dedicated',
      'dedicated_support': (f) => f.support === '24/7 dedicated',
      'phone_support': (f) => f.support !== 'email',
      
      // Advanced features
      'api_access': (f) => f.api_access === true || subscription.plan.type !== 'monthly',
      'custom_branding': (f) => f.customization === 'full' || f.custom_branding === true,
      'white_label': (f) => f.customization === 'full',
      'integrations': (f) => f.integrations === true || subscription.plan.type !== 'monthly',
      
      // Table and restaurant features
      'unlimited_tables': (f) => f.tables === 'unlimited',
      'multi_location': (f) => f.multi_location === true || f.customization === 'full',
      'advanced_reporting': (f) => f.analytics !== 'basic',
      
      // Export features
      'data_export': (f) => f.data_export === true || subscription.plan.type !== 'monthly',
      'bulk_operations': (f) => f.bulk_operations === true || subscription.plan.type === 'custom',
    };

    const featureCheck = featureRules[feature];
    if (featureCheck) {
      return featureCheck(features);
    }

    // Default: if feature is explicitly defined in plan features, check its value
    if (features.hasOwnProperty(feature)) {
      return !!features[feature];
    }

    // Default: allow access for basic features
    return true;
  }
}