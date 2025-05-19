import { useState, useEffect } from "react";
import { paymentAPI } from "../../services/api";
import { PaymentMethod } from "./PaymentMethodSelector";
import useAuthStore from "../../store/authStore";
import { formatCurrency } from "../../utils/formatters";
import PayPalPayment from "./PayPalPayment";
import StripePayment from "./StripePayment";
import IyzicoPayment from "./IyzicoPayment";
import { useTranslation } from "react-i18next";

interface PaymentProcessorProps {
  orderId: string;
  orderTotal: number;
  onPaymentComplete: () => void;
  onPaymentError: (error: string) => void;
  paymentMethod: PaymentMethod;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  orderId,
  orderTotal,
  onPaymentComplete,
  onPaymentError,
  paymentMethod,
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  useEffect(() => {
    const initializePayment = async () => {
      setLoading(true);
      try {
        // Create initial payment record
        const payment = await paymentAPI.createPayment(
          orderId,
          paymentMethod,
          user?.id
        );
        setPaymentId(payment.id);
        setPaymentStatus(payment.status);

        // For cash payments, we're done
        if (paymentMethod === "cash") {
          onPaymentComplete();
          return;
        }

        // For card or online payments, process the payment
        await processPayment(payment.id);
      } catch (error: any) {
        console.error("Payment initialization error:", error);
        onPaymentError(error.message || "Failed to initialize payment");
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [orderId, paymentMethod]);

  const processPayment = async (id: string) => {
    setLoading(true);
    try {
      const result = await paymentAPI.processPayment(
        id,
        paymentMethod,
        undefined, // paymentMethodId - would come from a form in a real implementation
        undefined, // paymentIntentId - would come from the payment provider in a real implementation
        user?.id
      );

      setPaymentStatus(result.status);
      setPaymentDetails(result.paymentDetails);

      if (result.status === "completed") {
        onPaymentComplete();
      } else if (result.status === "failed") {
        onPaymentError("Payment processing failed");
      } else if (result.paymentDetails?.requiresAction) {
        // In a real implementation, this would redirect to the payment provider's page
        // or show a form for entering card details
        setPaymentDetails(result.paymentDetails);
      }
    } catch (error: any) {
      console.error("Payment processing error:", error);
      onPaymentError(error.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const handleMockPaymentSuccess = async () => {
    if (!paymentId) return;

    setLoading(true);
    try {
      // In a real implementation, this would use the actual payment provider's SDK
      // For now, we'll just simulate a successful payment
      const result = await paymentAPI.processPayment(
        paymentId,
        paymentMethod,
        "mock_payment_method_id", // Mock payment method ID
        paymentDetails?.paymentIntentId, // Use the payment intent ID from the initial request
        user?.id
      );

      setPaymentStatus(result.status);

      if (result.status === "completed") {
        onPaymentComplete();
      } else {
        onPaymentError("Payment processing failed");
      }
    } catch (error: any) {
      console.error("Payment processing error:", error);
      onPaymentError(error.message || "Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const handleMockPaymentFailure = () => {
    onPaymentError("Payment was cancelled by the user");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Processing payment...</p>
      </div>
    );
  }

  if (paymentStatus === "pending" && paymentDetails?.requiresAction) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t("payment.completeYourPayment")}
        </h3>
        <p className="text-gray-600 mb-4">
          {t("payment.totalAmount")}: {formatCurrency(orderTotal)}
        </p>

        {paymentMethod === "paypal" ? (
          <PayPalPayment
            paymentDetails={paymentDetails}
            onSuccess={onPaymentComplete}
            onError={onPaymentError}
            amount={orderTotal}
            orderId={orderId}
          />
        ) : paymentMethod === "stripe" ? (
          <StripePayment
            paymentDetails={paymentDetails}
            onSuccess={onPaymentComplete}
            onError={onPaymentError}
            amount={orderTotal}
            orderId={orderId}
          />
        ) : paymentMethod === "iyzico" ? (
          <IyzicoPayment
            paymentDetails={paymentDetails}
            onSuccess={onPaymentComplete}
            onError={onPaymentError}
            amount={orderTotal}
            orderId={orderId}
          />
        ) : (
          // Default payment interface for other methods
          <div className="border border-gray-300 rounded-lg p-4 mb-4">
            <p className="text-gray-700 mb-2">
              {t("payment.mockPaymentInterface")}
            </p>
            <p className="text-gray-700 mb-4">
              {t("payment.realImplementationNote")}
            </p>

            <div className="flex space-x-4">
              <button
                onClick={handleMockPaymentSuccess}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
              >
                {t("payment.simulateSuccess")}
              </button>
              <button
                onClick={handleMockPaymentFailure}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
              >
                {t("payment.simulateFailure")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default PaymentProcessor;
