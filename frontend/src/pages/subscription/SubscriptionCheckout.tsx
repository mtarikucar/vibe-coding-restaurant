import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CreditCardIcon,
  LockClosedIcon,
  GlobeAltIcon,
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
}

const SubscriptionCheckout = () => {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [country, setCountry] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        setError('No plan selected');
        setLoading(false);
        return;
      }

      try {
        const planData = await subscriptionAPI.getPlanById(planId);
        setPlan(planData);
      } catch (err: any) {
        setError(err.message || 'Failed to load plan data');
        console.error('Error fetching plan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !user) return;

    setProcessing(true);
    setError(null);

    try {
      // In a real implementation, this would use Stripe or iyzico SDK
      // to create a payment method and then create a subscription
      
      // For this example, we'll just create a subscription directly
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      const subscriptionData = {
        userId: user.id,
        planId: plan.id,
        startDate,
        endDate,
        autoRenew: true,
        paymentProvider: country.toLowerCase() === 'turkey' || country.toLowerCase() === 'tr' 
          ? 'iyzico' 
          : 'stripe',
        paymentDetails: {
          // In a real implementation, this would include the payment method ID
          // from Stripe or iyzico, not the actual card details
          last4: cardNumber.slice(-4),
          cardName,
          country,
        },
        amount: plan.price,
        currency: country.toLowerCase() === 'turkey' || country.toLowerCase() === 'tr' ? 'try' : 'usd',
      };

      await subscriptionAPI.createSubscription(subscriptionData);
      setSuccess(true);
      
      // Redirect to subscription page after a delay
      setTimeout(() => {
        navigate('/app/subscription');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment failed');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as MM/YY
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    
    return digits;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/app/subscription')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {t('subscription.backToPlans')}
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h2 className="text-xl font-bold mb-2">{t('subscription.paymentSuccessful')}</h2>
          <p>{t('subscription.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t('subscription.checkout')}</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h2 className="text-xl font-semibold mb-4">{t('subscription.paymentDetails')}</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">{t('subscription.country')}</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    <option value="">{t('subscription.selectCountry')}</option>
                    <option value="Turkey">Turkey</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">{t('subscription.paymentMethod')}</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="credit_card"
                        checked={paymentMethod === 'credit_card'}
                        onChange={() => setPaymentMethod('credit_card')}
                        className="mr-2"
                      />
                      {t('subscription.creditCard')}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="debit_card"
                        checked={paymentMethod === 'debit_card'}
                        onChange={() => setPaymentMethod('debit_card')}
                        className="mr-2"
                      />
                      {t('subscription.debitCard')}
                    </label>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">{t('subscription.cardNumber')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full border rounded px-3 py-2 pl-10"
                      placeholder="1234 5678 9012 3456"
                      required
                      maxLength={19}
                    />
                    <CreditCardIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">{t('subscription.cardholderName')}</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-gray-700 mb-2">{t('subscription.expiryDate')}</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      className="w-full border rounded px-3 py-2"
                      placeholder="MM/YY"
                      required
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">{t('subscription.cvc')}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className="w-full border rounded px-3 py-2 pl-10"
                        placeholder="123"
                        required
                        maxLength={3}
                      />
                      <LockClosedIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center mb-6">
                  <GlobeAltIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-500">
                    {country.toLowerCase() === 'turkey' || country.toLowerCase() === 'tr'
                      ? t('subscription.processorIyzico')
                      : t('subscription.processorStripe')}
                  </span>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded font-medium"
                  disabled={processing}
                >
                  {processing
                    ? t('subscription.processing')
                    : t('subscription.payNow', { amount: plan?.price || 0 })}
                </button>
              </form>
            </div>
          </div>
          
          {/* Order Summary */}
          <div>
            <div className="bg-gray-50 rounded-lg shadow-sm p-6 border">
              <h2 className="text-xl font-semibold mb-4">{t('subscription.orderSummary')}</h2>
              
              {plan && (
                <>
                  <div className="mb-4">
                    <h3 className="font-medium">{plan.name}</h3>
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>
                  
                  <div className="border-t border-b py-4 my-4">
                    <div className="flex justify-between mb-2">
                      <span>{t('subscription.subtotal')}</span>
                      <span>${plan.price}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>{t('subscription.total')}</span>
                      <span>${plan.price}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>{t('subscription.billingCycle', { type: plan.type })}</p>
                    <p className="mt-2">{t('subscription.autoRenew')}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckout;
