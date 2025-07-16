import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Database, Clock, AlertTriangle } from 'lucide-react';
import useSubscriptionStore from '../../stores/subscriptionStore';

interface UsageData {
  tables: { used: number; limit: number | null };
  users: { used: number; limit: number | null };
  storage: { used: number; limit: number | null }; // In MB
  apiCalls: { used: number; limit: number | null };
}

interface UsageLimitsProps {
  className?: string;
  showTitle?: boolean;
}

const UsageLimits: React.FC<UsageLimitsProps> = ({
  className = '',
  showTitle = true,
}) => {
  const { subscriptionStatus, currentSubscription } = useSubscriptionStore();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, [currentSubscription]);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/usage/current', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number | null): number => {
    if (limit === null) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600 dark:text-red-400';
    if (percentage >= 75) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const formatStorage = (mb: number): string => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const formatLimit = (limit: number | null, type: string): string => {
    if (limit === null) return 'Unlimited';
    
    if (type === 'storage') {
      return formatStorage(limit);
    }
    
    return limit.toLocaleString();
  };

  const getPlanLimits = () => {
    if (!currentSubscription?.plan?.features) {
      return {
        tables: null,
        users: 5,
        storage: 1024, // 1GB
        apiCalls: 1000,
      };
    }

    const features = currentSubscription.plan.features;
    
    return {
      tables: features.tables === 'unlimited' ? null : parseInt(features.tables) || 10,
      users: features.users === 'unlimited' ? null : parseInt(features.users?.replace(/\D/g, '')) || 5,
      storage: features.storage === 'unlimited' ? null : parseInt(features.storage?.replace(/\D/g, '')) || 1024,
      apiCalls: features.api_calls === 'unlimited' ? null : parseInt(features.api_calls?.replace(/\D/g, '')) || 1000,
    };
  };

  const planLimits = getPlanLimits();

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const usageItems = [
    {
      icon: Database,
      label: 'Tables',
      used: usageData?.tables.used || 0,
      limit: planLimits.tables,
      color: 'blue',
    },
    {
      icon: Users,
      label: 'Users',
      used: usageData?.users.used || 0,
      limit: planLimits.users,
      color: 'purple',
    },
    {
      icon: BarChart3,
      label: 'Storage',
      used: usageData?.storage.used || 0,
      limit: planLimits.storage,
      color: 'green',
      formatter: formatStorage,
    },
    {
      icon: Clock,
      label: 'API Calls',
      used: usageData?.apiCalls.used || 0,
      limit: planLimits.apiCalls,
      color: 'orange',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Usage & Limits
          </h3>
          {subscriptionStatus?.planName && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {subscriptionStatus.planName}
            </span>
          )}
        </div>
      )}

      <div className="space-y-6">
        {usageItems.map((item) => {
          const percentage = getUsagePercentage(item.used, item.limit);
          const isNearLimit = percentage >= 75;
          const isOverLimit = percentage >= 90;
          
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <item.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </span>
                </div>
                <div className="text-sm">
                  <span className={getUsageColor(percentage)}>
                    {item.formatter ? item.formatter(item.used) : item.used.toLocaleString()}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 mx-1">/</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatLimit(item.limit, item.label.toLowerCase())}
                  </span>
                </div>
              </div>

              {item.limit !== null && (
                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className={`h-2 rounded-full ${getProgressBarColor(percentage)}`}
                    />
                  </div>
                  
                  {isNearLimit && (
                    <div className="flex items-center mt-2 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1 text-orange-500" />
                      <span className="text-orange-600 dark:text-orange-400">
                        {isOverLimit 
                          ? 'Limit exceeded - consider upgrading'
                          : 'Approaching limit'
                        }
                      </span>
                    </div>
                  )}
                </div>
              )}

              {item.limit === null && (
                <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-1">
                  <span>Unlimited usage</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrade suggestion if any limits are being approached */}
      {usageItems.some(item => item.limit !== null && getUsagePercentage(item.used, item.limit) >= 75) && (
        <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Usage Warning
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                You're approaching your plan limits. Consider upgrading to avoid service interruption.
              </p>
              <button className="mt-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200">
                View Upgrade Options →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No subscription warning */}
      {!subscriptionStatus?.hasActiveSubscription && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Get More with a Subscription
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Unlock unlimited features and remove usage restrictions.
            </p>
            <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
              Choose a Plan →
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default UsageLimits;