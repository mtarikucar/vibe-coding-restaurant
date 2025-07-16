import React from 'react';
import { 
  ClockIcon, 
  ChefHatIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface Order {
  id: string;
  status: string;
  createdAt: string;
  items: Array<{ status: string }>;
}

interface KitchenStatsProps {
  orders: Order[];
}

const KitchenStats: React.FC<KitchenStatsProps> = ({ orders }) => {
  const { t } = useTranslation();

  const stats = React.useMemo(() => {
    const now = Date.now();
    
    const pending = orders.filter(order => order.status === 'pending').length;
    const preparing = orders.filter(order => order.status === 'preparing').length;
    const ready = orders.filter(order => order.status === 'ready').length;
    
    const urgent = orders.filter(order => {
      const createdTime = new Date(order.createdAt).getTime();
      const minutesOld = (now - createdTime) / (1000 * 60);
      return minutesOld > 30;
    }).length;

    const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);
    const completedItems = orders.reduce((sum, order) => 
      sum + order.items.filter(item => item.status === 'ready').length, 0
    );

    return {
      pending,
      preparing,
      ready,
      urgent,
      totalItems,
      completedItems,
      total: orders.length
    };
  }, [orders]);

  const statCards = [
    {
      title: t('kitchen.stats.pending'),
      value: stats.pending,
      icon: ClockIcon,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: t('kitchen.stats.preparing'),
      value: stats.preparing,
      icon: ChefHatIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('kitchen.stats.ready'),
      value: stats.ready,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: t('kitchen.stats.urgent'),
      value: stats.urgent,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <div key={stat.title} className={`${stat.bgColor} rounded-lg p-4 border border-opacity-20`}>
          <div className="flex items-center">
            <div className={`${stat.color} p-2 rounded-lg`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
      
      {/* Progress indicator */}
      {stats.totalItems > 0 && (
        <div className="col-span-full bg-white rounded-lg p-4 border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {t('kitchen.stats.itemProgress')}
            </span>
            <span className="text-sm text-gray-500">
              {stats.completedItems}/{stats.totalItems}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(stats.completedItems / stats.totalItems) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenStats;