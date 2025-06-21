import { useState, useEffect } from"react";
import { useTranslation } from"react-i18next";
import { formatCurrency } from"../../utils/formatters";

interface IyzicoPaymentProps {
 paymentDetails: any;
 onSuccess: () => void;
 onError: (error: string) => void;
 amount: number;
 orderId: string;
}

const IyzicoPayment: React.FC<IyzicoPaymentProps> = ({
 paymentDetails,
 onSuccess,
 onError,
 amount,
 orderId,
}) => {
 const [loading, setLoading] = useState(false);
 const [cardNumber, setCardNumber] = useState("");
 const [cardExpiry, setCardExpiry] = useState("");
 const [cardCvc, setCardCvc] = useState("");
 const [cardName, setCardName] = useState("");
 const [iyzicoLoaded, setIyzicoLoaded] = useState(false);
 const [checkoutFormContent, setCheckoutFormContent] = useState<string | null>(null);
 const { t } = useTranslation();

 useEffect(() => {
  // In a real implementation, this would load the iyzico checkout form
  if (paymentDetails?.checkoutFormContent) {
   setCheckoutFormContent(paymentDetails.checkoutFormContent);
   setIyzicoLoaded(true);
  } else if (paymentDetails?.paymentPageUrl) {
   // If there's a payment page URL, we would redirect to it
   // For now, we'll just simulate the form loading
   setIyzicoLoaded(true);
   setCheckoutFormContent("<div>iyzico Checkout Form (Mock)</div>");
  }
 }, [paymentDetails]);

 const formatCardNumber = (value: string) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g,"");
  
  // Add space after every 4 digits
  const formatted = digits.replace(/(\d{4})(?=\d)/g,"$1 ");
  
  // Limit to 19 characters (16 digits + 3 spaces)
  return formatted.slice(0, 19);
 };

 const formatCardExpiry = (value: string) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g,"");
  
  // Format as MM/YY
  if (digits.length > 2) {
   return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  
  return digits;
 };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
   // In a real implementation, this would submit the form to iyzico
   // and handle the response
   
   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 1500));
   
   // Simulate successful payment
   onSuccess();
  } catch (error: any) {
   console.error("iyzico payment error:", error);
   onError(error.message ||"Payment processing failed");
  } finally {
   setLoading(false);
  }
 };

 const handleIyzicoSuccess = () => {
  onSuccess();
 };

 const handleIyzicoFailure = () => {
  onError("Payment was cancelled or failed");
 };

 if (!iyzicoLoaded) {
  return (
   <div className="flex flex-col items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    <p className="mt-2 text-gray-600">{t("payment.loadingIyzico")}</p>
   </div>
  );
 }

 // If we have a checkout form from iyzico, render it
 if (checkoutFormContent) {
  return (
   <div className="bg-white rounded-lg">
    <div className="mb-4">
     <p className="text-gray-700 font-medium mb-2">
      {t("payment.totalAmount")}: {formatCurrency(amount,"TRY")}
     </p>
     <p className="text-sm text-gray-500">
      {t("payment.securePaymentNote")}
     </p>
    </div>

    {/* In a real implementation, this would render the iyzico checkout form */}
    <div className="border border-gray-300 rounded-lg p-4 mb-4">
     <p className="text-gray-700 mb-2">
      {t("payment.mockIyzicoInterface")}
     </p>
     <p className="text-gray-700 mb-4">
      {t("payment.realImplementationNote")}
     </p>

     <div className="flex space-x-4">
      <button
       onClick={handleIyzicoSuccess}
       className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
      >
       {t("payment.simulateSuccess")}
      </button>
      <button
       onClick={handleIyzicoFailure}
       className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
      >
       {t("payment.simulateFailure")}
      </button>
     </div>
    </div>
   </div>
  );
 }

 // Otherwise, render our own form
 return (
  <div className="bg-white rounded-lg">
   <div className="mb-4">
    <p className="text-gray-700 font-medium mb-2">
     {t("payment.totalAmount")}: {formatCurrency(amount,"TRY")}
    </p>
    <p className="text-sm text-gray-500">
     {t("payment.securePaymentNote")}
    </p>
   </div>

   <form onSubmit={handleSubmit} className="space-y-4">
    <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
      {t("payment.cardName")}
     </label>
     <input
      type="text"
      value={cardName}
      onChange={(e) => setCardName(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      placeholder="John Doe"
      required
     />
    </div>

    <div>
     <label className="block text-sm font-medium text-gray-700 mb-1">
      {t("payment.cardNumber")}
     </label>
     <input
      type="text"
      value={cardNumber}
      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      placeholder="5528 7900 0000 0008"
      required
      maxLength={19}
     />
    </div>

    <div className="grid grid-cols-2 gap-4">
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       {t("payment.expiryDate")}
      </label>
      <input
       type="text"
       value={cardExpiry}
       onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
       placeholder="MM/YY"
       required
       maxLength={5}
      />
     </div>
     <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
       {t("payment.cvc")}
      </label>
      <input
       type="text"
       value={cardCvc}
       onChange={(e) => setCardCvc(e.target.value.replace(/\D/g,"").slice(0, 3))}
       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
       placeholder="123"
       required
       maxLength={3}
      />
     </div>
    </div>

    <button
     type="submit"
     className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
     disabled={loading}
    >
     {loading ? (
      <span className="flex items-center justify-center">
       <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
       >
        <circle
         className="opacity-25"
         cx="12"
         cy="12"
         r="10"
         stroke="currentColor"
         strokeWidth="4"
        ></circle>
        <path
         className="opacity-75"
         fill="currentColor"
         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
       </svg>
       {t("payment.processing")}
      </span>
     ) : (
      t("payment.payNow")
     )}
    </button>
   </form>
  </div>
 );
};

export default IyzicoPayment;
