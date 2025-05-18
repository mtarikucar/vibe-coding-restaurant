import { useState, useEffect } from "react";
import {
  CheckIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { kitchenAPI } from "../../services/api";
import { formatTimeAgo } from "../../utils/formatters";
import socketService from "../../services/socket";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  status: string;
}

interface Order {
  id: string;
  orderNumber: string;
  table: {
    id: string;
    number: number;
  };
  items: OrderItem[];
  status: string;
  createdAt: string;
  updatedAt: string;
  waiter: {
    id: string;
    fullName: string;
  };
}

const Kitchen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await kitchenAPI.getActiveOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Connect to socket for real-time updates
    const socket = socketService.connect();
    
    // Listen for order updates
    socketService.on('order:created', (newOrder) => {
      if (newOrder.status === 'pending' || newOrder.status === 'preparing') {
        setOrders(prevOrders => [...prevOrders, newOrder]);
      }
    });
    
    socketService.on('order:updated', (updatedOrder) => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    });
    
    socketService.on('order:status', (updatedOrder) => {
      if (updatedOrder.status !== 'pending' && updatedOrder.status !== 'preparing') {
        // Remove orders that are no longer active
        setOrders(prevOrders => 
          prevOrders.filter(order => order.id !== updatedOrder.id)
        );
      } else {
        // Update the order status
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === updatedOrder.id ? updatedOrder : order
          )
        );
      }
    });
    
    socketService.on('order:item:status', (updatedItem) => {
      setOrders(prevOrders => 
        prevOrders.map(order => {
          // Find the order that contains this item
          const orderContainsItem = order.items.some(item => item.id === updatedItem.id);
          
          if (orderContainsItem) {
            // Update the item in the order
            const updatedItems = order.items.map(item => 
              item.id === updatedItem.id ? updatedItem : item
            );
            
            // Check if all items are in the same status
            const allItemsStatus = checkAllItemsStatus(updatedItems);
            
            return {
              ...order,
              items: updatedItems,
              status: allItemsStatus || order.status
            };
          }
          
          return order;
        })
      );
    });
    
    return () => {
      // Clean up socket listeners
      socketService.off('order:created', () => {});
      socketService.off('order:updated', () => {});
      socketService.off('order:status', () => {});
      socketService.off('order:item:status', () => {});
    };
  }, []);

  const handleItemStatusChange = async (orderId: string, itemId: string, newStatus: string) => {
    try {
      await kitchenAPI.updateOrderItemStatus(orderId, itemId, newStatus);
      // The socket will handle the update
    } catch (err) {
      console.error('Error updating item status:', err);
      setError('Failed to update item status. Please try again.');
    }
  };

  const checkAllItemsStatus = (items: OrderItem[]): string | null => {
    if (items.length === 0) return null;
    
    const firstStatus = items[0].status;
    const allSameStatus = items.every(item => item.status === firstStatus);
    
    return allSameStatus ? firstStatus : null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter orders that are pending or preparing
  const activeOrders = orders.filter(
    (order) => order.status === 'pending' || order.status === 'preparing'
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Kitchen Panel</h2>
        <button
          onClick={fetchOrders}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
          title="Refresh orders"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-2 bg-red-200 hover:bg-red-300 text-red-700 px-3 py-1 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : activeOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-900">{order.orderNumber}</span>
                    <span className="ml-2 text-sm text-gray-500">Table {order.table?.number}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-500">{formatTimeAgo(order.createdAt)}</span>
                  </div>
                </div>
                <div className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    Waiter: {order.waiter?.fullName}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <ul className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-3 flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {item.quantity}x {item.menuItem?.name}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-sm text-gray-500">Note: {item.notes}</p>
                        )}
                        <span
                          className={`mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleItemStatusChange(order.id, item.id, 'preparing')}
                            className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                            title="Start Preparing"
                          >
                            <ClockIcon className="h-5 w-5" />
                          </button>
                        )}
                        {(item.status === 'pending' || item.status === 'preparing') && (
                          <button
                            onClick={() => handleItemStatusChange(order.id, item.id, 'ready')}
                            className="bg-green-500 hover:bg-green-600 text-white p-1 rounded"
                            title="Mark as Ready"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No active orders at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default Kitchen;
