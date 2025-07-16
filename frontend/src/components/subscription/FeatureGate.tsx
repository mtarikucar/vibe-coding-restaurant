import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Upgrade, Star } from 'lucide-react';
import useSubscriptionStore from '../../stores/subscriptionStore';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
  className?: string;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  upgradeMessage,
  className = '',
}) => {
  const { canAccess, subscriptionStatus, availablePlans } = useSubscriptionStore();

  const featureAccess = canAccess(feature);

  // If user has access, render children
  if (featureAccess.hasAccess) {
    return <>{children}</>;
  }

  // If fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If upgrade prompt is disabled, render nothing
  if (!showUpgradePrompt) {
    return null;
  }

  // Render upgrade prompt
  const getUpgradeMessage = () => {
    if (upgradeMessage) return upgradeMessage;

    if (featureAccess.limitation === 'subscription_required') {
      return 'This feature requires an active subscription.';
    }

    if (featureAccess.limitation === 'plan_upgrade_required') {
      return `This feature is not available in your current plan (${featureAccess.currentPlan}). Upgrade to unlock it.`;
    }

    return 'This feature requires a subscription upgrade.';
  };

  const getFeatureName = () => {
    return feature
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRecommendedPlan = () => {
    // Simple logic to recommend a plan based on feature
    if (feature.includes('premium') || feature.includes('advanced')) {
      return availablePlans.find(plan => plan.type === 'YEARLY') || availablePlans[1];
    }
    return availablePlans.find(plan => plan.type === 'MONTHLY') || availablePlans[0];
  };

  const recommendedPlan = getRecommendedPlan();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative ${className}`}
    >
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg opacity-60 z-10" />
      
      {/* Blurred children */}
      <div className="filter blur-sm pointer-events-none">
        {children}
      </div>

      {/* Upgrade prompt overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 mx-4 max-w-md text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {getFeatureName()} Locked
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {getUpgradeMessage()}
          </p>

          {/* Recommended plan */}
          {recommendedPlan && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-4 h-4 text-primary-600 mr-2" />
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  Recommended Plan
                </span>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {recommendedPlan.name}
                </h4>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  ${recommendedPlan.price}
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    /{recommendedPlan.type === 'YEARLY' ? 'year' : 'month'}
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-colors font-medium">
              <Upgrade className="w-4 h-4" />
              <span>Upgrade Now</span>
            </button>

            {!subscriptionStatus?.hasActiveSubscription && recommendedPlan?.trialPeriod && (
              <button className="w-full px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                Start {recommendedPlan.trialPeriod}-Day Free Trial
              </button>
            )}

            <button className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm">
              View All Plans
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default FeatureGate;