import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardAPI } from '../../services/api';
import { Card, Button } from '../../components/ui';
import usePerformanceMonitoring from '../../hooks/usePerformanceMonitoring';

interface TopSellingItem {
  id: string;
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface TopSellingItemsProps {
  limit?: number;
}

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658'];

const TopSellingItems: React.FC<TopSellingItemsProps> = ({ limit = 5 }) => {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [sortBy, setSortBy] = useState<'count' | 'revenue'>('count');
  const [items, setItems] = useState<TopSellingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize performance monitoring
  const { trackAsyncOperation } = usePerformanceMonitoring('TopSellingItems', {
    trackMount: true,
    trackRender: true,
    metadata: { component: 'TopSellingItems' },
  });

  const fetchTopSellingItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await trackAsyncOperation('fetchTopSellingItems', () =>
        dashboardAPI.getPopularItems(limit)
      );
      setItems(data);
    } catch (err) {
      console.error('Error fetching top selling items:', err);
      setError(t('dashboard.topSellingItemsError', 'Failed to load top selling items'));
      // Set empty data if error
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopSellingItems();
  }, [limit]);

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'count') {
      return b.count - a.count;
    } else {
      return b.revenue - a.revenue;
    }
  });

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    if (error || items.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-gray-500">
          <p>{error || t('dashboard.noTopSellingItems', 'No top selling items available')}</p>
          <Button
            onClick={fetchTopSellingItems}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            {t('common.tryAgain', 'Try Again')}
          </Button>
        </div>
      );
    }

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={sortedItems}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            <Bar
              dataKey={sortBy}
              name={
                sortBy === 'count'
                  ? t('dashboard.orderCount', 'Order Count')
                  : t('dashboard.revenue', 'Revenue')
              }
              fill="#8884d8"
            />
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sortedItems}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={100}
              fill="#8884d8"
              dataKey={sortBy}
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {sortedItems.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card variant="default" className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-lg font-semibold">
          {t('dashboard.topSellingItems', 'Top Selling Items')}
        </h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex space-x-1">
            <Button
              variant={chartType === 'bar' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              {t('dashboard.chartTypes.bar', 'Bar')}
            </Button>
            <Button
              variant={chartType === 'pie' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
            >
              {t('dashboard.chartTypes.pie', 'Pie')}
            </Button>
          </div>
          <div className="flex space-x-1">
            <Button
              variant={sortBy === 'count' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('count')}
            >
              {t('dashboard.byCount', 'By Count')}
            </Button>
            <Button
              variant={sortBy === 'revenue' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('revenue')}
            >
              {t('dashboard.byRevenue', 'By Revenue')}
            </Button>
          </div>
        </div>
      </div>
      {renderChart()}
    </Card>
  );
};

export default TopSellingItems;
