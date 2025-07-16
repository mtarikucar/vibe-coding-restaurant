import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Calendar,
  CreditCard,
  Settings,
  Upgrade
} from 'lucide-react';
import useSubscriptionStore from '../../stores/subscriptionStore';

interface SubscriptionStatusProps {
  showActions?: boolean;
  compact?: boolean;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  showActions = true,
  compact = false,
}) => {
  const {
    currentSubscription,
    subscriptionStatus,
    loading,
    fetchCurrentSubscription,
    cancelSubscription,
  } = useSubscriptionStore();

  useEffect(() => {
    if (!currentSubscription && !loading) {
      fetchCurrentSubscription();
    }
  }, [currentSubscription, loading, fetchCurrentSubscription]);

  const getStatusIcon = () => {
    if (!currentSubscription) {
      return <XCircle className="w-6 h-6 text-gray-400" />;
    }

    switch (currentSubscription.status) {
      case 'ACTIVE':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'TRIAL':
        return <Clock className="w-6 h-6 text-blue-500" />;
      case 'EXPIRED':
      case 'FAILED':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'CANCELED':
        return <XCircle className="w-6 h-6 text-gray-500" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    if (!currentSubscription) return 'text-gray-600 dark:text-gray-400';

    switch (currentSubscription.status) {
      case 'ACTIVE':
        return 'text-green-600 dark:text-green-400';
      case 'TRIAL':
        return 'text-blue-600 dark:text-blue-400';
      case 'EXPIRED':
      case 'FAILED':
        return 'text-red-600 dark:text-red-400';
      case 'CANCELED':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getStatusText = () => {
    if (!currentSubscription) return 'No Subscription';

    switch (currentSubscription.status) {
      case 'ACTIVE':
        return 'Active';
      case 'TRIAL':
        return 'Free Trial';
      case 'EXPIRED':
        return 'Expired';
      case 'FAILED':
        return 'Payment Failed';
      case 'CANCELED':
        return 'Canceled';
      case 'PENDING':
        return 'Pending';
      default:
        return currentSubscription.status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      try {
        await cancelSubscription();
      } catch (error) {
        console.error('Failed to cancel subscription:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {subscriptionStatus?.daysUntilExpiry && subscriptionStatus.daysUntilExpiry <= 7 && (
          <span className="text-sm text-orange-600 dark:text-orange-400">
            ({subscriptionStatus.daysUntilExpiry} days left)
          </span>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Subscription Status
        </h3>
        {showActions && (
          <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <p className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            {currentSubscription && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentSubscription.plan?.name || 'Unknown Plan'}
              </p>
            )}
          </div>
        </div>

        {/* Subscription Details */}
        {currentSubscription && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Plan Details */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Plan</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {currentSubscription.plan?.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ${currentSubscription.amount} {currentSubscription.currency.toUpperCase()}
                {currentSubscription.plan?.type === 'YEARLY' ? '/year' : '/month'}
              </p>
            </div>

            {/* Next Payment */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {currentSubscription.status === 'TRIAL' ? 'Trial Ends' : 'Next Payment'}
              </p>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentSubscription.status === 'TRIAL' && currentSubscription.endDate
                    ? formatDate(currentSubscription.endDate)
                    : currentSubscription.nextPaymentDate
                    ? formatDate(currentSubscription.nextPaymentDate)
                    : 'N/A'}
                </p>
              </div>
              {subscriptionStatus?.daysUntilExpiry && subscriptionStatus.daysUntilExpiry <= 7 && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  {subscriptionStatus.daysUntilExpiry} days remaining
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Payment Method</p>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900 dark:text-white">
                  {currentSubscription.paymentProvider}
                </p>
              </div>
            </div>

            {/* Auto Renewal */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Auto Renewal</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {currentSubscription.autoRenew ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {subscriptionStatus?.daysUntilExpiry && subscriptionStatus.daysUntilExpiry <= 3 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {currentSubscription?.status === 'TRIAL'
                  ? `Your trial expires in ${subscriptionStatus.daysUntilExpiry} days. Upgrade to continue using premium features.`
                  : `Your subscription expires in ${subscriptionStatus.daysUntilExpiry} days.`}
              </p>
            </div>
          </div>
        )}

        {currentSubscription?.status === 'FAILED' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-800 dark:text-red-200">
                Payment failed. Please update your payment method to avoid service interruption.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {!currentSubscription && (
              <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Upgrade className="w-4 h-4" />
                <span>Choose Plan</span>
              </button>
            )}

            {currentSubscription?.status === 'TRIAL' && (
              <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Upgrade className="w-4 h-4" />
                <span>Upgrade Now</span>
              </button>
            )}

            {currentSubscription?.status === 'ACTIVE' && (
              <>
                <button className="px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                  Manage Plan
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {currentSubscription?.status === 'FAILED' && (
              <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                <CreditCard className="w-4 h-4" />
                <span>Update Payment</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SubscriptionStatus;