import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { orderAPI } from '../../services/api';
import { formatCurrency, formatDate, formatTimeAgo } from '../../utils/formatters';
import { type Order, OrderStatus } from '../../types/order';
import { useToast } from '../../components/common/ToastProvider';
import InvoiceButton from '../../components/invoice/InvoiceButton';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const data = await orderAPI.getOrder(id);
        setOrder(data);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!order) return;
    
    try {
      await orderAPI.updateOrderStatus(order.id, status);
      showToast('success', 'Order status updated successfully');
      // Refresh order data
      const updatedOrder = await orderAPI.getOrder(order.id);
      setOrder(updatedOrder);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PREPARING:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.READY:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.SERVED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.COMPLETED:
        return 'bg-gray-100 text-gray-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePayment = () => {
    if (!order) return;
    navigate(`/app/payments/process/${order.id}`);
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
          onClick={() => navigate('/app/orders')}
          className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
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
          onClick={() => navigate('/app/orders')}
          className="mt-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-4 py-2 rounded flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/app/orders')}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Orders
        </button>
        <div className="flex space-x-2">
          {(order.status === OrderStatus.SERVED || order.status === OrderStatus.COMPLETED) && (
            <>
              <button
                onClick={handlePayment}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Process Payment
              </button>
              <InvoiceButton orderId={order.id} />
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Order {order.orderNumber}
              </h2>
              <p className="text-gray-500 mt-1">
                Table: {order.table.number}
              </p>
            </div>
            <span
              className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
                order.status
              )}`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Order Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Order Date:</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span className="font-medium flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {formatTimeAgo(order.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Waiter:</span>
                <span className="font-medium">{order.waiter.fullName}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Current Status:</span>
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated:</span>
                <span className="font-medium">{formatDate(order.updatedAt)}</span>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Status
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.values(OrderStatus).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(status)}
                    disabled={order.status === status}
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      order.status === status
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : `${getStatusColor(status)} hover:opacity-80`
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.menuItem.name}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-500">{item.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex flex-col items-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-medium">Total:</span>
                <span className="text-lg font-bold">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-700">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
