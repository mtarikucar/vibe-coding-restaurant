import { useState, useEffect } from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface PayPalPaymentProps {
 paymentDetails: any;
 onSuccess: () => void;
 onError: (error: string) => void;
 amount: number;
 currency?: string;
 orderId: string;
}

const PayPalPayment: React.FC<PayPalPaymentProps> = ({
 paymentDetails,
 onSuccess,
 onError,
 amount,
 currency = 'USD',
 orderId,
}) => {
 const [loading, setLoading] = useState(false);
 const { t } = useTranslation();

 useEffect(() => {
  // If we have a redirect URL, open it in a new window
  if (paymentDetails?.paymentUrl) {
   // Store the orderId and payment status in localStorage to check when the user returns
   localStorage.setItem('pendingPaymentOrderId', orderId);
   
   // Open the PayPal payment page
   window.open(paymentDetails.paymentUrl, '_blank');
   
   // Set up a listener to check for payment completion
   const checkPaymentInterval = setInterval(() => {
    // This would be replaced with an actual API call to check payment status
    const paymentCompleted = localStorage.getItem(`paymentCompleted_${orderId}`);
    if (paymentCompleted === 'true') {
     clearInterval(checkPaymentInterval);
     localStorage.removeItem('pendingPaymentOrderId');
     localStorage.removeItem(`paymentCompleted_${orderId}`);
     onSuccess();
    }
   }, 2000);
   
   // Clean up the interval when the component unmounts
   return () => {
    clearInterval(checkPaymentInterval);
   };
  }
 }, [paymentDetails, orderId, onSuccess]);

 // This function would be used in a real implementation to handle the PayPal button click
 const handlePayPalButtonClick = () => {
  setLoading(true);
  
  // In a real implementation, this would create a PayPal payment and redirect to PayPal
  // For now, we'll just simulate a redirect
  setTimeout(() => {
   if (Math.random() > 0.2) { // 80% success rate for demo
    // Simulate a successful payment
    localStorage.setItem(`paymentCompleted_${orderId}`, 'true');
    onSuccess();
   } else {
    // Simulate a failed payment
    onError(t('payment.paypalPaymentFailed'));
   }
   setLoading(false);
  }, 1500);
 };

 return (
  <div className="p-4 border border-gray-200 rounded-lg">
   <div className="flex items-center mb-4">
    <CurrencyDollarIcon className="h-8 w-8 text-blue-500 mr-2" />
    <h3 className="text-lg font-medium">{t('payment.payWithPayPal')}</h3>
   </div>
   
   {paymentDetails?.paymentUrl ? (
    <div className="text-center">
     <p className="mb-4">{t('payment.redirectedToPayPal')}</p>
     <p className="text-sm text-gray-500">{t('payment.ifNotRedirected')}</p>
     <a 
      href={paymentDetails.paymentUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-block mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
     >
      {t('payment.goToPayPal')}
     </a>
    </div>
   ) : (
    <div className="text-center">
     <p className="mb-4">
      {t('payment.payAmount', { amount: `${currency} ${amount.toFixed(2)}` })}
     </p>
     <button
      onClick={handlePayPalButtonClick}
      disabled={loading}
      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
     >
      {loading ? (
       <span className="flex items-center justify-center">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {t('common.processing')}
       </span>
      ) : (
       t('payment.payWithPayPal')
      )}
     </button>
    </div>
   )}
  </div>
 );
};

export default PayPalPayment;
