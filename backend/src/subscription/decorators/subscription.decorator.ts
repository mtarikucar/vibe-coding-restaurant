import { SetMetadata } from '@nestjs/common';
import { SubscriptionRequirement } from '../guards/subscription.guard';

export const SUBSCRIPTION_KEY = 'subscription_requirement';

/**
 * Decorator to require subscription for accessing endpoints
 * 
 * @param requirement - Subscription requirements
 * 
 * @example
 * ```typescript
 * @RequireSubscription({ required: true })
 * @Get('premium-feature')
 * async getPremiumFeature() {
 *   // Only accessible with active subscription
 * }
 * 
 * @RequireSubscription({ required: true, allowTrial: true })
 * @Get('trial-feature')
 * async getTrialFeature() {
 *   // Accessible with active subscription or trial
 * }
 * 
 * @RequireSubscription({ required: true, minPlanType: 'YEARLY' })
 * @Get('premium-only')
 * async getPremiumOnlyFeature() {
 *   // Only accessible with yearly or enterprise plan
 * }
 * ```
 */
export const RequireSubscription = (requirement: SubscriptionRequirement = { required: true }) =>
  SetMetadata(SUBSCRIPTION_KEY, requirement);

/**
 * Decorator to require active subscription (no trial)
 */
export const RequireActiveSubscription = () =>
  RequireSubscription({ required: true, allowTrial: false });

/**
 * Decorator to allow trial access
 */
export const AllowTrialAccess = () =>
  RequireSubscription({ required: true, allowTrial: true });

/**
 * Decorator to require specific plan type
 */
export const RequirePlanType = (minPlanType: string) =>
  RequireSubscription({ required: true, minPlanType });

/**
 * Decorator to require premium plan (yearly or enterprise)
 */
export const RequirePremiumPlan = () =>
  RequireSubscription({ required: true, minPlanType: 'YEARLY' });

/**
 * Decorator to require enterprise plan
 */
export const RequireEnterprisePlan = () =>
  RequireSubscription({ required: true, minPlanType: 'ENTERPRISE' });