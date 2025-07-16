import React from 'react';
import { 
  ClockIcon, 
  CheckIcon, 
  ChefHatIcon,
  ExclamationTriangleIcon,
  UserIcon,
  TableCellsIcon 
} from '@heroicons/react/24/outline';
import { formatTimeAgo } from '../../../utils/formatters';
import { useTranslation } from 'react-i18next';

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

interface KitchenOrderCardProps {
  order: Order;
  onItemStatusChange: (orderId: string, itemId: string, newStatus: string) => void;
  onOrderStatusChange: (orderId: string, newStatus: string) => void;
  isProcessing?: boolean;
}

const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
  order,
  onItemStatusChange,
  onOrderStatusChange,
  isProcessing = false,
}) => {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderPriorityColor = () => {
    const createdTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    const minutesOld = (now - createdTime) / (1000 * 60);

    if (minutesOld > 30) return 'border-l-red-500 bg-red-50';
    if (minutesOld > 15) return 'border-l-orange-500 bg-orange-50';
    return 'border-l-green-500 bg-white';
  };

  const getTimeUrgency = () => {
    const createdTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    const minutesOld = (now - createdTime) / (1000 * 60);

    if (minutesOld > 30) return { color: 'text-red-600', urgent: true };
    if (minutesOld > 15) return { color: 'text-orange-600', urgent: true };
    return { color: 'text-gray-600', urgent: false };
  };

  const canAdvanceOrder = () => {
    const allItemsReady = order.items.every(item => item.status === 'ready');
    return allItemsReady || order.status === 'pending';
  };

  const getNextOrderAction = () => {
    if (order.status === 'pending') {
      return {
        action: 'preparing',
        label: t('kitchen.startCooking'),
        color: 'bg-blue-600 hover:bg-blue-700',
        icon: ChefHatIcon,
      };
    }
    if (order.status === 'preparing' && canAdvanceOrder()) {
      return {
        action: 'ready',
        label: t('kitchen.orderReady'),
        color: 'bg-green-600 hover:bg-green-700',
        icon: CheckIcon,
      };
    }
    return null;
  };

  const timeUrgency = getTimeUrgency();
  const nextAction = getNextOrderAction();

  return (
    <div className={`rounded-lg shadow-sm border-l-4 ${getOrderPriorityColor()} transition-all duration-200 hover:shadow-md`}>
      {/* Order Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-3 rounded-t-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg">{order.orderNumber}</span>
              <div className="flex items-center text-slate-300">
                <TableCellsIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">Table {order.table?.number}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                <span>{order.waiter?.fullName}</span>
              </div>
              <div className={`flex items-center ${timeUrgency.color}`}>
                <ClockIcon className="h-4 w-4 mr-1" />
                <span className="font-medium">{formatTimeAgo(order.createdAt)}</span>
                {timeUrgency.urgent && (
                  <ExclamationTriangleIcon className="h-4 w-4 ml-1" />
                )}
              </div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
            {t(`orders.status.${order.status}`)}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-4">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 bg-white px-2 py-1 rounded text-sm">
                    {item.quantity}×
                  </span>
                  <span className="font-medium text-gray-900">{item.menuItem?.name}</span>
                </div>
                {item.notes && (
                  <p className="mt-1 text-sm text-gray-600 italic bg-yellow-50 px-2 py-1 rounded border-l-2 border-yellow-300">
                    📝 {item.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                  {t(`orders.itemStatus.${item.status}`)}
                </span>
                {item.status === 'pending' && (
                  <button
                    onClick={() => onItemStatusChange(order.id, item.id, 'preparing')}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <ChefHatIcon className="h-3 w-3" />
                    Start
                  </button>
                )}
                {item.status === 'preparing' && (
                  <button
                    onClick={() => onItemStatusChange(order.id, item.id, 'ready')}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <CheckIcon className="h-3 w-3" />
                    Done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Actions */}
      {nextAction && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={() => onOrderStatusChange(order.id, nextAction.action)}
            disabled={isProcessing || !canAdvanceOrder()}
            className={`w-full ${nextAction.color} disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm`}
          >
            <nextAction.icon className="h-5 w-5" />
            {nextAction.label}
            {!canAdvanceOrder() && order.status === 'preparing' && (
              <span className="text-xs opacity-75">(Finish all items first)</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default KitchenOrderCard;