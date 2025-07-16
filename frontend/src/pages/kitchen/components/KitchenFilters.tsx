import React from 'react';
import { 
  FunnelIcon, 
  ClockIcon, 
  ChefHatIcon, 
  CheckCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface KitchenFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const KitchenFilters: React.FC<KitchenFiltersProps> = ({
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  searchTerm,
  onSearchChange,
}) => {
  const { t } = useTranslation();

  const filters = [
    { key: 'all', label: t('kitchen.filters.all'), icon: FunnelIcon, count: 0 },
    { key: 'pending', label: t('kitchen.filters.pending'), icon: ClockIcon, count: 0 },
    { key: 'preparing', label: t('kitchen.filters.preparing'), icon: ChefHatIcon, count: 0 },
    { key: 'ready', label: t('kitchen.filters.ready'), icon: CheckCircleIcon, count: 0 },
  ];

  const sortOptions = [
    { key: 'oldest', label: t('kitchen.sort.oldest') },
    { key: 'newest', label: t('kitchen.sort.newest') },
    { key: 'table', label: t('kitchen.sort.table') },
    { key: 'status', label: t('kitchen.sort.status') },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder={t('kitchen.search.placeholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <filter.icon className="h-4 w-4" />
              {filter.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            {t('kitchen.sort.label')}:
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default KitchenFilters;