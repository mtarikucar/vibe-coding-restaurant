import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
 QrCodeIcon,
 ClockIcon,
 UserGroupIcon,
 CurrencyDollarIcon,
 BellIcon,
 CheckCircleIcon,
 ExclamationTriangleIcon,
 PlusIcon,
 EyeIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatTimeAgo } from '../../utils/formatters';
import socketService from '../../services/socket';

interface Table {
 id: string;
 number: number;
 capacity: number;
 status: 'available' | 'occupied' | 'reserved' | 'cleaning';
 guestCount?: number;
 activeOrder?: {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  estimatedPrepTime?: number;
 };
 qrCode?: {
  id: string;
  qrImageUrl: string;
  menuUrl: string;
 };
}

interface Order {
 id: string;
 orderNumber: string;
 table: { number: number };
 status: string;
 priority: 'low' | 'normal' | 'high' | 'urgent';
 totalAmount: number;
 estimatedPrepTime?: number;
 createdAt: string;
 items: Array<{
  id: string;
  menuItem: { name: string };
  quantity: number;
  status: string;
  notes?: string;
 }>;
}

interface EnhancedWaiterInterfaceProps {
 tables: Table[];
 orders: Order[];
 onTableSelect: (tableId: string) => void;
 onOrderSelect: (orderId: string) => void;
 onCreateOrder: (tableId: string) => void;
 onUpdateOrderStatus: (orderId: string, status: string) => void;
}

const EnhancedWaiterInterface: React.FC<EnhancedWaiterInterfaceProps> = ({
 tables,
 orders,
 onTableSelect,
 onOrderSelect,
 onCreateOrder,
 onUpdateOrderStatus,
}) => {
 const { t } = useTranslation();
 const [activeTab, setActiveTab] = useState<'tables' | 'orders' | 'notifications'>('tables');
 const [notifications, setNotifications] = useState<any[]>([]);
 const [searchQuery, setSearchQuery] = useState('');

 useEffect(() => {
  // Listen for real-time notifications
  socketService.on('orderStatusUpdate', (data) => {
   setNotifications(prev => [...prev, {
    id: Date.now(),
    type: 'order_update',
    message: `Order ${data.orderNumber} status updated to ${data.status}`,
    timestamp: new Date(),
    orderId: data.orderId,
   }]);
  });

  socketService.on('newOrder', (data) => {
   setNotifications(prev => [...prev, {
    id: Date.now(),
    type: 'new_order',
    message: `New order ${data.orderNumber} for table ${data.tableNumber}`,
    timestamp: new Date(),
    orderId: data.orderId,
   }]);
  });

  return () => {
   socketService.off('orderStatusUpdate');
   socketService.off('newOrder');
  };
 }, []);

 const getTableStatusColor = (status: string) => {
  switch (status) {
   case 'available':
    return 'bg-green-100 text-green-800 border-green-200';
   case 'occupied':
    return 'bg-red-100 text-red-800 border-red-200';
   case 'reserved':
    return 'bg-blue-100 text-blue-800 border-blue-200';
   case 'cleaning':
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
   default:
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }
 };

 const getOrderPriorityColor = (priority: string) => {
  switch (priority) {
   case 'urgent':
    return 'bg-red-500';
   case 'high':
    return 'bg-orange-500';
   case 'normal':
    return 'bg-blue-500';
   case 'low':
    return 'bg-gray-500';
   default:
    return 'bg-blue-500';
  }
 };

 const getOrderStatusColor = (status: string) => {
  switch (status) {
   case 'pending':
    return 'text-yellow-600 bg-yellow-100';
   case 'preparing':
    return 'text-blue-600 bg-blue-100';
   case 'ready':
    return 'text-green-600 bg-green-100';
   case 'served':
    return 'text-purple-600 bg-purple-100';
   case 'completed':
    return 'text-gray-600 bg-gray-100';
   default:
    return 'text-gray-600 bg-gray-100';
  }
 };

 const filteredTables = tables.filter(table =>
  table.number.toString().includes(searchQuery) ||
  table.status.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const filteredOrders = orders.filter(order =>
  order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
  order.table.number.toString().includes(searchQuery) ||
  order.status.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const renderTabContent = () => {
  switch (activeTab) {
   case 'tables':
    return (
     <div className="space-y-4">
      {/* Search */}
      <div className="px-4">
       <input
        type="text"
        placeholder={t('common.search', 'Search tables...')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
       />
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 gap-4 px-4">
       {filteredTables.map((table) => (
        <div
         key={table.id}
         className={`relative p-4 rounded-lg border-2 ${getTableStatusColor(table.status)} cursor-pointer transition-all hover:shadow-md`}
         onClick={() => onTableSelect(table.id)}
        >
         {/* Priority indicator for urgent orders */}
         {table.activeOrder?.status === 'ready' && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
         )}

         <div className="text-center">
          <div className="text-2xl font-bold mb-1">
           {table.number}
          </div>
          <div className="text-sm opacity-75 mb-2">
           <UserGroupIcon className="w-4 h-4 inline mr-1" />
           {table.guestCount || table.capacity}
          </div>
          <div className="text-xs font-medium">
           {t(`tables.status.${table.status}`, table.status)}
          </div>

          {table.activeOrder && (
           <div className="mt-2 pt-2 border-t border-current border-opacity-20">
            <div className="text-xs">
             {table.activeOrder.orderNumber}
            </div>
            <div className="text-xs font-medium">
             {formatCurrency(table.activeOrder.totalAmount)}
            </div>
            <div className="text-xs opacity-75">
             {formatTimeAgo(new Date(table.activeOrder.createdAt))}
            </div>
           </div>
          )}
         </div>

         {/* Action buttons */}
         <div className="absolute bottom-2 right-2 flex space-x-1">
          {table.qrCode && (
           <button
            onClick={(e) => {
             e.stopPropagation();
             // Show QR code modal
            }}
            className="p-1 bg-white bg-opacity-80 rounded"
           >
            <QrCodeIcon className="w-4 h-4" />
           </button>
          )}
          {table.status === 'available' && (
           <button
            onClick={(e) => {
             e.stopPropagation();
             onCreateOrder(table.id);
            }}
            className="p-1 bg-white bg-opacity-80 rounded"
           >
            <PlusIcon className="w-4 h-4" />
           </button>
          )}
          {table.activeOrder && (
           <button
            onClick={(e) => {
             e.stopPropagation();
             onOrderSelect(table.activeOrder!.id);
            }}
            className="p-1 bg-white bg-opacity-80 rounded"
           >
            <EyeIcon className="w-4 h-4" />
           </button>
          )}
         </div>
        </div>
       ))}
      </div>
     </div>
    );

   case 'orders':
    return (
     <div className="space-y-4">
      {/* Search */}
      <div className="px-4">
       <input
        type="text"
        placeholder={t('common.search', 'Search orders...')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
       />
      </div>

      {/* Orders List */}
      <div className="space-y-3 px-4">
       {filteredOrders.map((order) => (
        <div
         key={order.id}
         className="bg-white rounded-lg shadow border p-4 cursor-pointer hover:shadow-md transition-shadow"
         onClick={() => onOrderSelect(order.id)}
        >
         <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
           <div className={`w-3 h-3 rounded-full ${getOrderPriorityColor(order.priority)}`}></div>
           <span className="font-semibold">{order.orderNumber}</span>
           <span className="text-sm text-gray-500">Table {order.table.number}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
           {t(`orders.status.${order.status}`, order.status)}
          </span>
         </div>

         <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <div className="flex items-center space-x-4">
           <span className="flex items-center">
            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
            {formatCurrency(order.totalAmount)}
           </span>
           {order.estimatedPrepTime && (
            <span className="flex items-center">
             <ClockIcon className="w-4 h-4 mr-1" />
             {order.estimatedPrepTime}m
            </span>
           )}
          </div>
          <span>{formatTimeAgo(new Date(order.createdAt))}</span>
         </div>

         <div className="text-sm text-gray-500">
          {order.items.length} {t('orders.items', 'items')}
          {order.items.some(item => item.notes) && (
           <span className="ml-2 text-yellow-600">
            <ExclamationTriangleIcon className="w-4 h-4 inline" />
           </span>
          )}
         </div>

         {/* Quick action buttons */}
         {order.status === 'ready' && (
          <div className="mt-3 flex space-x-2">
           <button
            onClick={(e) => {
             e.stopPropagation();
             onUpdateOrderStatus(order.id, 'served');
            }}
            className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
           >
            <CheckCircleIcon className="w-4 h-4 inline mr-1" />
            Mark as Served
           </button>
          </div>
         )}
        </div>
       ))}
      </div>
     </div>
    );

   case 'notifications':
    return (
     <div className="space-y-3 px-4">
      {notifications.length === 0 ? (
       <div className="text-center py-8 text-gray-500">
        <BellIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>{t('notifications.empty', 'No notifications')}</p>
       </div>
      ) : (
       notifications.map((notification) => (
        <div
         key={notification.id}
         className="bg-white rounded-lg shadow border p-4"
        >
         <div className="flex items-start justify-between">
          <div className="flex-1">
           <p className="text-sm font-medium text-gray-900">
            {notification.message}
           </p>
           <p className="text-xs text-gray-500 mt-1">
            {formatTimeAgo(notification.timestamp)}
           </p>
          </div>
          {notification.orderId && (
           <button
            onClick={() => onOrderSelect(notification.orderId)}
            className="ml-2 text-blue-600 hover:text-blue-800"
           >
            <EyeIcon className="w-4 h-4" />
           </button>
          )}
         </div>
        </div>
       ))
      )}
     </div>
    );

   default:
    return null;
  }
 };

 return (
  <div className="flex flex-col h-full bg-gray-50">
   {/* Tab Navigation */}
   <div className="bg-white border-b border-gray-200">
    <div className="flex">
     {[
      { key: 'tables', label: t('waiter.tables', 'Tables'), icon: UserGroupIcon },
      { key: 'orders', label: t('waiter.orders', 'Orders'), icon: ClockIcon },
      { key: 'notifications', label: t('waiter.notifications', 'Notifications'), icon: BellIcon },
     ].map((tab) => (
      <button
       key={tab.key}
       onClick={() => setActiveTab(tab.key as any)}
       className={`flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
        activeTab === tab.key
         ? 'border-blue-500 text-blue-600 bg-blue-50'
         : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
       }`}
      >
       <tab.icon className="w-5 h-5 mr-2" />
       {tab.label}
       {tab.key === 'notifications' && notifications.length > 0 && (
        <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
         {notifications.length}
        </span>
       )}
      </button>
     ))}
    </div>
   </div>

   {/* Tab Content */}
   <div className="flex-1 overflow-y-auto pb-20">
    {renderTabContent()}
   </div>
  </div>
 );
};

export default EnhancedWaiterInterface;
