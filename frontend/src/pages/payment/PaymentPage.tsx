import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderAPI, paymentAPI } from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
import PaymentMethodSelector from "../../components/payment/PaymentMethodSelector";
import { PaymentMethod } from "../../types/payment";
import PaymentProcessor from "../../components/payment/PaymentProcessor";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui";

const PaymentPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      setLoading(true);
      try {
        const orderData = await orderAPI.getOrder(orderId);
        setOrder(orderData);

        // Check if payment already exists
        try {
          const payment = await paymentAPI.getPaymentByOrder(orderId);
          if (payment && payment.status === "completed") {
            setPaymentStatus("success");
          }
        } catch (err) {
          // No payment exists yet, which is fine
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const handleStartPayment = () => {
    setPaymentStatus("processing");
  };

  const handlePaymentComplete = () => {
    setPaymentStatus("success");
  };

  const handlePaymentError = (errorMessage: string) => {
    setPaymentStatus("error");
    setPaymentError(errorMessage);
  };

  const handleRetry = () => {
    setPaymentStatus("idle");
    setPaymentError(null);
  };

  const handleDone = () => {
    navigate("/app/orders");
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-neutral-600 dark:text-neutral-400">
            {t("payment.loading", "Loading payment details...")}
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl">
          <h3 className="font-semibold mb-2">{t("common.error", "Error")}</h3>
          <p className="mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => navigate("/app/orders")}
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            {t("payment.backToOrders", "Back to Orders")}
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-6 py-4 rounded-xl">
          <h3 className="font-semibold mb-2">
            {t("payment.orderNotFound", "Order Not Found")}
          </h3>
          <p className="mb-4">
            {t(
              "payment.orderNotFoundDescription",
              "The order you're looking for could not be found."
            )}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/app/orders")}
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            {t("payment.backToOrders", "Back to Orders")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/orders")}
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            {t("common.back", "Back")}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary-900 dark:text-neutral-100">
              {t("payment.title", "Process Payment")}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {t("payment.subtitle", "Complete the payment for this order")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 px-4 py-3 rounded-xl">
          <CreditCardIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <span className="font-semibold text-primary-900 dark:text-primary-100">
            {t("payment.orderTotal", "Order Total")}:{" "}
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white dark:bg-darkGray-800 rounded-2xl shadow-soft p-6 mb-8">
        <h3 className="text-xl font-semibold text-primary-900 dark:text-neutral-100 mb-6">
          {t("payment.orderDetails", "Order Details")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {t("orders.orderNumber", "Order Number")}
            </p>
            <p className="text-lg font-semibold text-primary-900 dark:text-neutral-100">
              {order.orderNumber}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {t("orders.table", "Table")}
            </p>
            <p className="text-lg font-semibold text-primary-900 dark:text-neutral-100">
              {order.table?.number
                ? t("tables.tableNumber", { number: order.table.number })
                : t("common.notAvailable", "N/A")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {t("orders.status", "Status")}
            </p>
            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200">
              {t(`orders.statuses.${order.status}`, order.status)}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {t("orders.total", "Total")}
            </p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(order.totalAmount)}
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-darkGray-600 pt-6">
          <h4 className="text-lg font-semibold text-primary-900 dark:text-neutral-100 mb-4">
            {t("orders.orderItems", "Order Items")}
          </h4>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-darkGray-700 rounded-xl"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-sm font-semibold rounded-full">
                      {item.quantity}
                    </span>
                    <span className="font-medium text-primary-900 dark:text-neutral-100">
                      {item.menuItem?.name || item.name}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 ml-8">
                      {t("orders.notes", "Notes")}: {item.notes}
                    </p>
                  )}
                </div>
                <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                  {formatCurrency(
                    (item.price || item.menuItem?.price || 0) * item.quantity
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {paymentStatus === "idle" && (
        <div className="bg-white dark:bg-darkGray-800 rounded-2xl shadow-soft p-6">
          <h3 className="text-xl font-semibold text-primary-900 dark:text-neutral-100 mb-6">
            {t("payment.paymentMethod", "Payment Method")}
          </h3>
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onMethodChange={handlePaymentMethodChange}
          />
          <div className="mt-8">
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartPayment}
              leftIcon={<CreditCardIcon className="h-5 w-5" />}
              fullWidth
            >
              {t("payment.payAmount", "Pay {{amount}}", {
                amount: formatCurrency(order.totalAmount),
              })}
            </Button>
          </div>
        </div>
      )}

      {paymentStatus === "processing" && (
        <div className="bg-white dark:bg-darkGray-800 rounded-2xl shadow-soft p-6">
          <PaymentProcessor
            orderId={order.id}
            orderTotal={order.totalAmount}
            paymentMethod={paymentMethod}
            onPaymentComplete={handlePaymentComplete}
            onPaymentError={handlePaymentError}
          />
        </div>
      )}

      {paymentStatus === "success" && (
        <div className="bg-white dark:bg-darkGray-800 rounded-2xl shadow-soft p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-primary-900 dark:text-neutral-100 mb-3">
              {t("payment.success.title", "Payment Successful!")}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-center mb-8 max-w-md">
              {t(
                "payment.success.description",
                "The payment has been processed successfully. The order is now complete."
              )}
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleDone}
              leftIcon={<CheckCircleIcon className="h-5 w-5" />}
            >
              {t("payment.success.done", "Done")}
            </Button>
          </div>
        </div>
      )}

      {paymentStatus === "error" && (
        <div className="bg-white dark:bg-darkGray-800 rounded-2xl shadow-soft p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <XCircleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-primary-900 dark:text-neutral-100 mb-3">
              {t("payment.error.title", "Payment Failed")}
            </h3>
            <p className="text-red-600 dark:text-red-400 text-center mb-8 max-w-md">
              {paymentError ||
                t(
                  "payment.error.description",
                  "An error occurred during payment processing. Please try again."
                )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
              <Button
                variant="primary"
                size="lg"
                onClick={handleRetry}
                className="flex-1"
              >
                {t("payment.error.tryAgain", "Try Again")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDone}
                className="flex-1"
              >
                {t("common.cancel", "Cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
