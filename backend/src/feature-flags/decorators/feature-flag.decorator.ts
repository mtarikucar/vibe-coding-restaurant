import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'feature_flag_requirement';

export interface FeatureFlagRequirement {
  flag: string;
  fallbackBehavior?: 'block' | 'allow' | 'custom';
  customResponse?: any;
}

/**
 * Decorator to require a feature flag to be enabled
 * 
 * @param requirement - Feature flag requirement configuration
 * 
 * @example
 * ```typescript
 * @RequireFeatureFlag({ flag: 'advanced_analytics' })
 * @Get('analytics/advanced')
 * async getAdvancedAnalytics() {
 *   // Only accessible if advanced_analytics feature is enabled
 * }
 * 
 * @RequireFeatureFlag({ 
 *   flag: 'api_access', 
 *   fallbackBehavior: 'block' 
 * })
 * @Get('api/data')
 * async getApiData() {
 *   // Blocks access if api_access feature is disabled
 * }
 * 
 * @RequireFeatureFlag({ 
 *   flag: 'beta_features', 
 *   fallbackBehavior: 'custom',
 *   customResponse: { message: 'Feature coming soon!' }
 * })
 * @Get('beta/feature')
 * async getBetaFeature() {
 *   // Returns custom response if beta_features is disabled
 * }
 * ```
 */
export const RequireFeatureFlag = (requirement: FeatureFlagRequirement) =>
  SetMetadata(FEATURE_FLAG_KEY, requirement);

/**
 * Shortcut decorators for common feature flags
 */
export const RequireAdvancedAnalytics = () =>
  RequireFeatureFlag({ flag: 'advanced_analytics', fallbackBehavior: 'block' });

export const RequireAPIAccess = () =>
  RequireFeatureFlag({ flag: 'api_access', fallbackBehavior: 'block' });

export const RequireCustomBranding = () =>
  RequireFeatureFlag({ flag: 'custom_branding', fallbackBehavior: 'block' });

export const RequirePrioritySupport = () =>
  RequireFeatureFlag({ flag: 'priority_support', fallbackBehavior: 'block' });

export const RequireWhiteLabel = () =>
  RequireFeatureFlag({ flag: 'white_label', fallbackBehavior: 'block' });

export const RequireMultiLocation = () =>
  RequireFeatureFlag({ flag: 'multi_location', fallbackBehavior: 'block' });

export const RequireDataExport = () =>
  RequireFeatureFlag({ flag: 'data_export', fallbackBehavior: 'block' });