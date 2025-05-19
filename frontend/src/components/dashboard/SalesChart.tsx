import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from 'recharts';
import { dashboardAPI } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Card, Button } from '../../components/ui';
import usePerformanceMonitoring from '../../hooks/usePerformanceMonitoring';

interface SalesData {
  date: string;
  amount: number;
  orders?: number;
}

interface SalesChartProps {
  period: 'day' | 'week' | 'month';
}

const SalesChart: React.FC<SalesChartProps> = ({ period }) => {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<'line' | 'bar' | 'composed'>('line');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize performance monitoring
  const { trackAsyncOperation } = usePerformanceMonitoring('SalesChart', {
    trackMount: true,
    trackRender: true,
    metadata: { component: 'SalesChart' },
  });

  const fetchSalesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await trackAsyncOperation('fetchSalesData', () =>
        dashboardAPI.getSales(period)
      );
      setSalesData(data);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError(t('dashboard.salesDataError', 'Failed to load sales data'));
      // Set empty data if error
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [period]);

  const formatXAxis = (tickItem: string) => {
    // Format the date based on the period
    const date = new Date(tickItem);
    if (period === 'day') {
      return date.getHours() + ':00';
    } else if (period === 'week') {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    } else {
      return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
    }
  };

  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    if (error || salesData.length === 0) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-gray-500">
          <p>{error || t('dashboard.noSalesData', 'No sales data available')}</p>
          <Button
            onClick={fetchSalesData}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            {t('common.tryAgain', 'Try Again')}
          </Button>
        </div>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={salesData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis tickFormatter={formatTooltipValue} />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            <Line
              type="monotone"
              dataKey="amount"
              name={t('dashboard.sales', 'Sales')}
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={salesData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis tickFormatter={formatTooltipValue} />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            <Bar
              dataKey="amount"
              name={t('dashboard.sales', 'Sales')}
              fill="#8884d8"
            />
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={salesData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatXAxis} />
            <YAxis yAxisId="left" tickFormatter={formatTooltipValue} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="amount"
              name={t('dashboard.sales', 'Sales')}
              fill="#8884d8"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="orders"
              name={t('dashboard.orders', 'Orders')}
              stroke="#82ca9d"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="amount"
              fill="#8884d8"
              stroke="#8884d8"
              fillOpacity={0.3}
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card variant="default" className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {t('dashboard.salesOverTime', 'Sales Over Time')}
        </h3>
        <div className="flex space-x-2">
          <Button
            variant={chartType === 'line' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            {t('dashboard.chartTypes.line', 'Line')}
          </Button>
          <Button
            variant={chartType === 'bar' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
          >
            {t('dashboard.chartTypes.bar', 'Bar')}
          </Button>
          <Button
            variant={chartType === 'composed' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setChartType('composed')}
          >
            {t('dashboard.chartTypes.composed', 'Combined')}
          </Button>
        </div>
      </div>
      {renderChart()}
    </Card>
  );
};

export default SalesChart;
