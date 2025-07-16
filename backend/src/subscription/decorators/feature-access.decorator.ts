import { SetMetadata } from '@nestjs/common';
import { FeatureAccessRequirement } from '../guards/feature-access.guard';

export const FEATURE_ACCESS_KEY = 'feature_access_requirement';

/**
 * Decorator to control feature access based on subscription plan
 * 
 * @param requirement - Feature access requirements
 * 
 * @example
 * ```typescript
 * @RequireFeature({ feature: 'advanced_analytics' })
 * @Get('analytics/advanced')
 * async getAdvancedAnalytics() {
 *   // Only accessible with plans that include advanced analytics
 * }
 * 
 * @RequireFeature({ 
 *   feature: 'api_access', 
 *   fallbackBehavior: 'block' 
 * })
 * @Get('api/data')
 * async getApiData() {
 *   // Blocks access if plan doesn't include API access
 * }
 * 
 * @RequireFeature({ 
 *   feature: 'premium_support', 
 *   fallbackBehavior: 'degrade' 
 * })
 * @Post('support/ticket')
 * async createSupportTicket() {
 *   // Allows access but may provide degraded experience
 * }
 * ```
 */
export const RequireFeature = (requirement: FeatureAccessRequirement) =>
  SetMetadata(FEATURE_ACCESS_KEY, requirement);

/**
 * Decorator to require advanced analytics feature
 */
export const RequireAdvancedAnalytics = () =>
  RequireFeature({ feature: 'advanced_analytics', description: 'Advanced analytics dashboard' });

/**
 * Decorator to require premium analytics feature
 */
export const RequirePremiumAnalytics = () =>
  RequireFeature({ feature: 'premium_analytics', description: 'Premium analytics and reporting' });

/**
 * Decorator to require unlimited users feature
 */
export const RequireUnlimitedUsers = () =>
  RequireFeature({ feature: 'unlimited_users', description: 'Unlimited user accounts' });

/**
 * Decorator to require priority support feature
 */
export const RequirePrioritySupport = () =>
  RequireFeature({ feature: 'priority_support', description: 'Priority customer support' });

/**
 * Decorator to require API access feature
 */
export const RequireAPIAccess = () =>
  RequireFeature({ 
    feature: 'api_access', 
    description: 'API access for integrations',
    fallbackBehavior: 'block' 
  });

/**
 * Decorator to require custom branding feature
 */
export const RequireCustomBranding = () =>
  RequireFeature({ feature: 'custom_branding', description: 'Custom branding and theming' });

/**
 * Decorator to require white label feature
 */
export const RequireWhiteLabel = () =>
  RequireFeature({ 
    feature: 'white_label', 
    description: 'White label customization',
    fallbackBehavior: 'block' 
  });

/**
 * Decorator to require multi-location feature
 */
export const RequireMultiLocation = () =>
  RequireFeature({ feature: 'multi_location', description: 'Multi-location management' });

/**
 * Decorator to require data export feature
 */
export const RequireDataExport = () =>
  RequireFeature({ feature: 'data_export', description: 'Data export capabilities' });

/**
 * Decorator to require bulk operations feature
 */
export const RequireBulkOperations = () =>
  RequireFeature({ 
    feature: 'bulk_operations', 
    description: 'Bulk data operations',
    fallbackBehavior: 'block' 
  });