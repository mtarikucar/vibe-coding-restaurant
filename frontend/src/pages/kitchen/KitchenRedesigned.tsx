import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowPathIcon,
  ExclamationCircleIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/outline';
import { kitchenAPI, orderAPI } from '../../services/api';
import socketService from '../../services/socket';
import useAuthStore from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../components/common/ToastProvider';
import KitchenOrderCard from './components/KitchenOrderCard';
import KitchenStats from './components/KitchenStats';
import KitchenFilters from './components/KitchenFilters';

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

const KitchenRedesigned: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Filter and sort state
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('oldest');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuthStore();
  const { error: toastError, success, info } = useToast();

  // Play notification sound
  const playNotificationSound = () => {
    if (soundEnabled) {
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(console.error);
      } catch (error) {
        console.warn('Could not play notification sound:', error);
      }
    }
  };

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const allOrders = await orderAPI.getOrders();
      const kitchenOrders = allOrders.filter(
        (order) => order.status === 'pending' || order.status === 'preparing'
      );

      setOrders(kitchenOrders);
      setLastRefresh(new Date());

      if (kitchenOrders.length === 0) {
        console.log('No active orders found for kitchen');
      } else {
        console.log(`Found ${kitchenOrders.length} active orders for kitchen`);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
      toastError(t('kitchen.fetchError'));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Connect to socket for real-time updates
    if (user) {
      socketService.connect(user.id, user.tenantId);
    } else {
      socketService.connect();
    }

    // Socket event handlers
    const handleNewOrder = (newOrder: Order) => {
      if (newOrder.status === 'pending' || newOrder.status === 'preparing') {
        setOrders((prevOrders) => {
          if (prevOrders.some((o) => o.id === newOrder.id)) {
            return prevOrders;
          }
          playNotificationSound();
          info(`New order received: ${newOrder.orderNumber}`);
          return [newOrder, ...prevOrders];
        });
      }
    };

    const handleOrderUpdate = (updatedOrder: Order) => {
      setOrders((prevOrders) => {
        // If order is no longer active, remove it
        if (updatedOrder.status !== 'pending' && updatedOrder.status !== 'preparing') {
          return prevOrders.filter((order) => order.id !== updatedOrder.id);
        }
        
        // Update existing order
        return prevOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        );
      });
    };

    const handleItemUpdate = (updatedItem: any) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          const orderContainsItem = order.items.some((item) => item.id === updatedItem.id);

          if (orderContainsItem) {
            const updatedItems = order.items.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            );

            // Check if all items are ready
            const allItemsReady = updatedItems.every((item) => item.status === 'ready');
            const newOrderStatus = allItemsReady ? 'ready' : order.status;

            return {
              ...order,
              items: updatedItems,
              status: newOrderStatus,
            };
          }

          return order;
        })
      );
    };

    socketService.on('order:created', handleNewOrder);
    socketService.on('order:updated', handleOrderUpdate);
    socketService.on('order:status', handleOrderUpdate);
    socketService.on('order:item:status', handleItemUpdate);

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 30000);

    return () => {
      socketService.off('order:created', handleNewOrder);
      socketService.off('order:updated', handleOrderUpdate);
      socketService.off('order:status', handleOrderUpdate);
      socketService.off('order:item:status', handleItemUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const handleItemStatusChange = async (orderId: string, itemId: string, newStatus: string) => {
    const processingKey = `${orderId}-${itemId}`;
    setProcessingItems(prev => new Set(prev).add(processingKey));

    try {
      await orderAPI.updateOrderItemStatus(orderId, itemId, newStatus);
      success(t('orders.itemStatusUpdateSuccess'));

      // Optimistically update UI
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id === orderId) {
            const updatedItems = order.items.map((item) =>
              item.id === itemId ? { ...item, status: newStatus } : item
            );

            // Check if all items are ready
            const allItemsReady = updatedItems.every((item) => item.status === 'ready');
            
            return {
              ...order,
              items: updatedItems,
              status: allItemsReady && order.status === 'preparing' ? 'ready' : order.status,
            };
          }
          return order;
        })
      );
    } catch (err) {
      console.error('Error updating item status:', err);
      toastError(t('orders.itemStatusUpdateError'));
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(processingKey);
        return newSet;
      });
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    setProcessingItems(prev => new Set(prev).add(orderId));

    try {
      await orderAPI.updateOrderStatus(orderId, newStatus);
      success(t('orders.statusUpdateSuccess'));

      // Remove completed orders from the list
      if (newStatus === 'ready' || newStatus === 'served' || newStatus === 'completed') {
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
      } else {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      toastError(t('orders.statusUpdateError'));
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders;

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = orders.filter(order => order.status === activeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.table?.number.toString().includes(searchLower) ||
        order.waiter?.fullName.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.menuItem?.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'table':
          return (a.table?.number || 0) - (b.table?.number || 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, activeFilter, searchTerm, sortBy]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('kitchen.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
          >
            {soundEnabled ? (
              <SpeakerWaveIcon className="h-5 w-5" />
            ) : (
              <SpeakerXMarkIcon className="h-5 w-5" />
            )}
          </button>
          
          <button
            onClick={() => fetchOrders()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      )}

      {/* Stats */}
      <KitchenStats orders={orders} />

      {/* Filters */}
      <KitchenFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Orders Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredAndSortedOrders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedOrders.map((order) => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              onItemStatusChange={handleItemStatusChange}
              onOrderStatusChange={handleOrderStatusChange}
              isProcessing={processingItems.has(order.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || activeFilter !== 'all' 
              ? t('kitchen.noFilteredOrders') 
              : t('kitchen.noOrders')
            }
          </h3>
          <p className="text-gray-500">
            {searchTerm || activeFilter !== 'all'
              ? t('kitchen.adjustFilters')
              : t('kitchen.noOrdersDesc')
            }
          </p>
          {(searchTerm || activeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setActiveFilter('all');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('kitchen.clearFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default KitchenRedesigned;