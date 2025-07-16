import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown } from 'lucide-react';
import useSubscriptionStore, { SubscriptionPlan } from '../../stores/subscriptionStore';

interface SubscriptionPlansProps {
  onSelectPlan?: (plan: SubscriptionPlan) => void;
  showCurrentPlan?: boolean;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onSelectPlan,
  showCurrentPlan = true,
}) => {
  const {
    availablePlans,
    currentSubscription,
    loading,
    error,
    fetchAvailablePlans,
    startTrial,
  } = useSubscriptionStore();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState<string | null>(null);

  useEffect(() => {
    if (availablePlans.length === 0) {
      fetchAvailablePlans();
    }
  }, [fetchAvailablePlans, availablePlans.length]);

  const handleStartTrial = async (planId: string) => {
    setTrialLoading(planId);
    try {
      await startTrial(planId);
      // Show success message or redirect
    } catch (error) {
      console.error('Failed to start trial:', error);
    } finally {
      setTrialLoading(null);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.id);
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'monthly':
        return <Star className="w-6 h-6" />;
      case 'yearly':
        return <Zap className="w-6 h-6" />;
      case 'custom':
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'monthly':
        return 'from-blue-500 to-blue-600';
      case 'yearly':
        return 'from-purple-500 to-purple-600';
      case 'custom':
      case 'enterprise':
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.planId === planId;
  };

  if (loading && availablePlans.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Error loading plans: {error}</p>
        <button
          onClick={fetchAvailablePlans}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Select the perfect plan for your restaurant. Start with a free trial and upgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {availablePlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 transition-all duration-300 ${
              isCurrentPlan(plan.id)
                ? 'border-green-500 scale-105'
                : selectedPlan === plan.id
                ? 'border-primary-500 scale-105'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:scale-105'
            }`}
          >
            {/* Popular badge for yearly plan */}
            {plan.type === 'YEARLY' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {/* Current plan badge */}
            {isCurrentPlan(plan.id) && showCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="p-8">
              {/* Plan header */}
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${getPlanColor(plan.type)} text-white`}>
                  {getPlanIcon(plan.type)}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {plan.type.charAt(0) + plan.type.slice(1).toLowerCase()} Plan
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  {plan.type !== 'CUSTOM' && (
                    <span className="text-gray-600 dark:text-gray-300 ml-2">
                      /{plan.type === 'YEARLY' ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                {plan.type === 'YEARLY' && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Save ${((29.99 * 12) - plan.price).toFixed(0)} per year
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {plan.description}
              </p>

              {/* Features */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Features included:
                </h4>
                <ul className="space-y-2">
                  {Object.entries(plan.features || {}).map(([key, value]) => (
                    <li key={key} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                {!isCurrentPlan(plan.id) && (
                  <>
                    {/* Start Trial button */}
                    {plan.trialPeriod > 0 && (
                      <button
                        onClick={() => handleStartTrial(plan.id)}
                        disabled={trialLoading === plan.id}
                        className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        {trialLoading === plan.id ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Starting Trial...
                          </div>
                        ) : (
                          `Start ${plan.trialPeriod}-Day Free Trial`
                        )}
                      </button>
                    )}

                    {/* Select Plan button */}
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        plan.type === 'YEARLY'
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                          : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white'
                      }`}
                    >
                      {plan.type === 'CUSTOM' ? 'Contact Sales' : 'Select Plan'}
                    </button>
                  </>
                )}

                {isCurrentPlan(plan.id) && (
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-green-100 text-green-800 rounded-lg font-medium cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {availablePlans.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">No plans available at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;