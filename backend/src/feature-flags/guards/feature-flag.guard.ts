import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { FeatureFlagService } from '../services/feature-flag.service';
import { FEATURE_FLAG_KEY, FeatureFlagRequirement } from '../decorators/feature-flag.decorator';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  private readonly logger = new Logger(FeatureFlagGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureFlagRequirement = this.reflector.getAllAndOverride<FeatureFlagRequirement>(
      FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no feature flag requirement is set, allow access
    if (!featureFlagRequirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const user = request.user as any;

    if (!user) {
      // For unauthenticated users, apply fallback behavior
      return this.handleFeatureDisabled(
        featureFlagRequirement,
        response,
        'Authentication required for feature access'
      );
    }

    // Build context for feature flag evaluation
    const flagContext = {
      userId: user.id,
      tenantId: user.tenant?.id,
      subscription: request.subscription,
      userEmail: user.email,
    };

    try {
      const isEnabled = await this.featureFlagService.isFeatureEnabled(
        featureFlagRequirement.flag,
        flagContext,
      );

      if (isEnabled) {
        // Add feature flag info to request for downstream use
        request.featureFlags = request.featureFlags || {};
        request.featureFlags[featureFlagRequirement.flag] = true;
        
        this.logger.debug(
          `Feature flag ${featureFlagRequirement.flag} enabled for user ${user.id}`
        );
        return true;
      }

      // Feature is disabled, handle based on fallback behavior
      return this.handleFeatureDisabled(
        featureFlagRequirement,
        response,
        `Feature '${featureFlagRequirement.flag}' is not enabled for your account`
      );
    } catch (error) {
      this.logger.error(
        `Error checking feature flag ${featureFlagRequirement.flag}: ${error.message}`,
        error.stack,
      );

      // On error, apply fallback behavior
      return this.handleFeatureDisabled(
        featureFlagRequirement,
        response,
        'Error checking feature availability'
      );
    }
  }

  private handleFeatureDisabled(
    requirement: FeatureFlagRequirement,
    response: any,
    message: string,
  ): boolean {
    const fallbackBehavior = requirement.fallbackBehavior || 'block';

    switch (fallbackBehavior) {
      case 'allow':
        this.logger.warn(`Feature ${requirement.flag} disabled but allowing access due to fallback behavior`);
        return true;

      case 'custom':
        if (requirement.customResponse) {
          response.status(200).json(requirement.customResponse);
          return false;
        }
        // Fall through to block if no custom response provided
        
      case 'block':
      default:
        throw new ForbiddenException({
          message,
          feature: requirement.flag,
          upgradeRequired: true,
          availableInPlans: this.getFeatureAvailableInPlans(requirement.flag),
        });
    }
  }

  private getFeatureAvailableInPlans(featureFlag: string): string[] {
    // This could be made more dynamic by querying the feature flag configuration
    const featurePlanMapping: Record<string, string[]> = {
      'advanced_analytics': ['Premium', 'Enterprise'],
      'unlimited_users': ['Enterprise'],
      'api_access': ['Basic', 'Premium', 'Enterprise'],
      'custom_branding': ['Premium', 'Enterprise'],
      'priority_support': ['Premium', 'Enterprise'],
      'white_label': ['Enterprise'],
      'multi_location': ['Premium', 'Enterprise'],
      'data_export': ['Basic', 'Premium', 'Enterprise'],
    };

    return featurePlanMapping[featureFlag] || ['Premium', 'Enterprise'];
  }
}