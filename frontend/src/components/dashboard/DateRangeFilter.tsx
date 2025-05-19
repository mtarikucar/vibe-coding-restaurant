import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Button } from '../../components/ui';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  onPeriodChange: (period: 'day' | 'week' | 'month') => void;
  period: 'day' | 'week' | 'month';
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onDateRangeChange,
  onPeriodChange,
  period,
}) => {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month') => {
    onPeriodChange(newPeriod);
  };

  const handleDateRangeApply = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert(t('dashboard.dateRangeError', 'Start date cannot be after end date'));
      return;
    }
    
    onDateRangeChange(start, end);
    setShowDatePicker(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold mb-2">
            {t('dashboard.timeRange', 'Time Range')}
          </h3>
          <div className="flex space-x-2">
            <Button
              variant={period === 'day' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('day')}
            >
              {t('dashboard.periods.daily', 'Daily')}
            </Button>
            <Button
              variant={period === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('week')}
            >
              {t('dashboard.periods.weekly', 'Weekly')}
            </Button>
            <Button
              variant={period === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('month')}
            >
              {t('dashboard.periods.monthly', 'Monthly')}
            </Button>
          </div>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {t('dashboard.customDateRange', 'Custom Date Range')}
          </Button>
        </div>
      </div>

      {showDatePicker && (
        <div className="mt-4 p-4 border border-gray-200 rounded-lg">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dashboard.startDate', 'Start Date')}
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dashboard.endDate', 'End Date')}
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleDateRangeApply}
              >
                {t('common.apply', 'Apply')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
