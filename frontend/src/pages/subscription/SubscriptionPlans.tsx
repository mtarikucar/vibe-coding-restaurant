import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckIcon,
  XMarkIcon,
  CreditCardIcon,
  ClockIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { subscriptionAPI } from '../../services/subscriptionAPI';
import useAuthStore from '../../store/authStore';
import { useTranslation } from 'react-i18next';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'monthly' | 'yearly' | 'custom';
  duration: number;
  trialPeriod: number;
  features: Record<string, any>;
}

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'expired' | 'trial' | 'pending' | 'failed';
  startDate: string;
  endDate: string;
  plan: Plan;
}

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customDetails, setCustomDetails] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [customSuccess, setCustomSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch plans
        const plansData = await subscriptionAPI.getPlans();
        setPlans(plansData);

        // Try to fetch current subscription
        try {
          const subscriptionData = await subscriptionAPI.getMySubscription();
          setSubscription(subscriptionData);
        } catch (err) {
          // It's okay if the user doesn't have a subscription yet
          console.log('No active subscription found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load subscription data');
        console.error('Error fetching subscription data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartTrial = async (planId: string) => {
    setLoading(true);
    setError(null);
    try {
      await subscriptionAPI.startTrial(planId);
      // Refresh subscription data
      const subscriptionData = await subscriptionAPI.getMySubscription();
      setSubscription(subscriptionData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start trial');
      console.error('Error starting trial:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    // In a real implementation, this would redirect to a payment page
    navigate(`/app/subscription/checkout/${planId}`);
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    if (!window.confirm(t('subscription.confirmCancel'))) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await subscriptionAPI.cancelSubscription(subscription.id);
      // Refresh subscription data
      const subscriptionData = await subscriptionAPI.getMySubscription();
      setSubscription(subscriptionData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel subscription');
      console.error('Error canceling subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDetails || !customEmail) return;
    
    setCustomSubmitting(true);
    try {
      await subscriptionAPI.requestCustomPlan({
        details: customDetails,
        email: customEmail,
      });
      setCustomSuccess(true);
      setTimeout(() => {
        setShowCustomModal(false);
        setCustomSuccess(false);
        setCustomDetails('');
        setCustomEmail('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request');
      console.error('Error submitting custom plan request:', err);
    } finally {
      setCustomSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('subscription.plans')}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {subscription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">{t('subscription.currentPlan')}</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <span className="font-medium">{t('subscription.plan')}:</span> {subscription.plan.name}
            </div>
            <div>
              <span className="font-medium">{t('subscription.status')}:</span> {subscription.status}
            </div>
            <div>
              <span className="font-medium">{t('subscription.validUntil')}:</span> {new Date(subscription.endDate).toLocaleDateString()}
            </div>
          </div>
          {subscription.status === 'active' && (
            <button
              onClick={handleCancelSubscription}
              className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              {t('subscription.cancelSubscription')}
            </button>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="border rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="text-gray-600">{plan.description}</p>
            </div>
            <div className="p-4">
              <div className="text-2xl font-bold mb-4">
                ${plan.price} <span className="text-sm font-normal text-gray-500">/ {plan.type}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {Object.entries(plan.features).map(([key, value]) => (
                  <li key={key} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>
                      <strong>{key}:</strong> {value}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                {!subscription && (
                  <button
                    onClick={() => handleStartTrial(plan.id)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-2 flex items-center justify-center"
                  >
                    <ClockIcon className="h-5 w-5 mr-2" />
                    {t('subscription.startTrial', { days: plan.trialPeriod })}
                  </button>
                )}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center"
                  disabled={loading}
                >
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  {t('subscription.subscribe')}
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* Custom Plan Card */}
        <div className="border rounded-lg shadow-sm overflow-hidden">
          <div className="bg-purple-50 p-4 border-b">
            <h2 className="text-xl font-bold">{t('subscription.customPlan')}</h2>
            <p className="text-gray-600">{t('subscription.customPlanDescription')}</p>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold mb-4">
              {t('subscription.contactUs')}
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>{t('subscription.customFeature1')}</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>{t('subscription.customFeature2')}</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>{t('subscription.customFeature3')}</span>
              </li>
            </ul>
            <button
              onClick={() => setShowCustomModal(true)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center justify-center"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              {t('subscription.requestInfo')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Custom Plan Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('subscription.requestCustomPlan')}</h2>
              <button onClick={() => setShowCustomModal(false)}>
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            {customSuccess ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {t('subscription.requestSent')}
              </div>
            ) : (
              <form onSubmit={handleCustomRequest}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">{t('subscription.email')}</label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">{t('subscription.details')}</label>
                  <textarea
                    value={customDetails}
                    onChange={(e) => setCustomDetails(e.target.value)}
                    className="w-full border rounded px-3 py-2 h-32"
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
                  disabled={customSubmitting}
                >
                  {customSubmitting ? t('subscription.sending') : t('subscription.send')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
