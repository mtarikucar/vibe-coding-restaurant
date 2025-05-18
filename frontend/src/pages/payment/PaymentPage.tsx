import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI, paymentAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import PaymentMethodSelector, { PaymentMethod } from '../../components/payment/PaymentMethodSelector';
import PaymentProcessor from '../../components/payment/PaymentProcessor';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const PaymentPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
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
          if (payment && payment.status === 'completed') {
            setPaymentStatus('success');
          }
        } catch (err) {
          // No payment exists yet, which is fine
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
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
    setPaymentStatus('processing');
  };

  const handlePaymentComplete = () => {
    setPaymentStatus('success');
  };

  const handlePaymentError = (errorMessage: string) => {
    setPaymentStatus('error');
    setPaymentError(errorMessage);
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setPaymentError(null);
  };

  const handleDone = () => {
    navigate('/orders');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p>Order not found</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Process Payment</h2>
        <button
          onClick={() => navigate('/orders')}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
        >
          Back to Orders
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-lg font-medium">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Table</p>
            <p className="text-lg font-medium">{order.table?.number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-lg font-medium">{order.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-medium">{formatCurrency(order.total)}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-md font-medium text-gray-800 mb-2">Order Items</h4>
          <div className="space-y-2">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{item.quantity}x </span>
                  <span>{item.menuItem.name}</span>
                </div>
                <div className="text-gray-700">{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {paymentStatus === 'idle' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onMethodChange={handlePaymentMethodChange}
          />
          <div className="mt-6">
            <button
              onClick={handleStartPayment}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium"
            >
              Pay {formatCurrency(order.total)}
            </button>
          </div>
        </div>
      )}

      {paymentStatus === 'processing' && (
        <div className="bg-white rounded-lg shadow p-6">
          <PaymentProcessor
            orderId={order.id}
            orderTotal={order.total}
            paymentMethod={paymentMethod}
            onPaymentComplete={handlePaymentComplete}
            onPaymentError={handlePaymentError}
          />
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center justify-center py-6">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-6">The payment has been processed successfully.</p>
            <button
              onClick={handleDone}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center justify-center py-6">
            <XCircleIcon className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Payment Failed</h3>
            <p className="text-red-600 mb-6">{paymentError || 'An error occurred during payment processing.'}</p>
            <div className="flex space-x-4">
              <button
                onClick={handleRetry}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium"
              >
                Try Again
              </button>
              <button
                onClick={handleDone}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-md font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
