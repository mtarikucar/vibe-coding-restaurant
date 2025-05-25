import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  XMarkIcon, 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui';
import { type MenuItem, type Category } from '../../types/menu';

interface MenuVisualizationProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  categories: Category[];
}

type ViewMode = 'desktop' | 'mobile';
type MenuStyle = 'classic' | 'modern' | 'minimal';

const MenuVisualization: React.FC<MenuVisualizationProps> = ({
  isOpen,
  onClose,
  menuItems,
  categories,
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [menuStyle, setMenuStyle] = useState<MenuStyle>('modern');
  const [showCustomization, setShowCustomization] = useState(false);
  const [customization, setCustomization] = useState({
    primaryColor: '#89A8B2',
    backgroundColor: '#F1F0E8',
    fontFamily: 'Inter',
    showImages: true,
    showDescriptions: true,
    showPrices: true,
    compactMode: false,
  });

  const getStyleClasses = () => {
    const baseClasses = "transition-all duration-300";
    
    switch (menuStyle) {
      case 'classic':
        return `${baseClasses} bg-white text-gray-900 font-serif`;
      case 'minimal':
        return `${baseClasses} bg-gray-50 text-gray-800 font-light`;
      case 'modern':
      default:
        return `${baseClasses} bg-neutral-100 text-primary-900 font-sans`;
    }
  };

  const getContainerClasses = () => {
    const baseClasses = "mx-auto transition-all duration-300";
    
    if (viewMode === 'mobile') {
      return `${baseClasses} w-80 h-[600px] border-8 border-gray-800 rounded-3xl overflow-hidden shadow-2xl`;
    }
    
    return `${baseClasses} w-full h-full rounded-xl overflow-hidden shadow-lg`;
  };

  const getCategoryItems = (categoryId: string) => {
    return menuItems.filter(item => item.categoryId === categoryId && item.isAvailable);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-100 dark:bg-darkGray-800 rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-soft">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-300 dark:border-darkGray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-primary-900 dark:text-neutral-100">
              {t('menu.visualization', 'Menu Visualization')}
            </h2>
            
            {/* View Mode Toggle */}
            <div className="flex bg-neutral-200 dark:bg-darkGray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-white dark:bg-darkGray-600 text-primary-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-primary-900 dark:hover:text-neutral-100'
                }`}
              >
                <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                {t('common.desktop', 'Desktop')}
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-white dark:bg-darkGray-600 text-primary-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-primary-900 dark:hover:text-neutral-100'
                }`}
              >
                <DevicePhoneMobileIcon className="h-4 w-4 mr-1" />
                {t('common.mobile', 'Mobile')}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomization(!showCustomization)}
              leftIcon={<Cog6ToothIcon className="h-4 w-4" />}
            >
              {t('menu.customize', 'Customize')}
            </Button>
            
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Customization Panel */}
          {showCustomization && (
            <div className="w-80 bg-white dark:bg-darkGray-700 border-r border-neutral-300 dark:border-darkGray-600 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-neutral-100 mb-4">
                {t('menu.customization', 'Customization')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 dark:text-neutral-300 mb-2">
                    {t('menu.style', 'Style')}
                  </label>
                  <select
                    value={menuStyle}
                    onChange={(e) => setMenuStyle(e.target.value as MenuStyle)}
                    className="w-full bg-neutral-100 dark:bg-darkGray-800 border border-neutral-300 dark:border-darkGray-700 rounded-xl px-3 py-2 text-primary-900 dark:text-neutral-100"
                  >
                    <option value="modern">{t('menu.styleModern', 'Modern')}</option>
                    <option value="classic">{t('menu.styleClassic', 'Classic')}</option>
                    <option value="minimal">{t('menu.styleMinimal', 'Minimal')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 dark:text-neutral-300 mb-2">
                    {t('menu.primaryColor', 'Primary Color')}
                  </label>
                  <input
                    type="color"
                    value={customization.primaryColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-neutral-300 dark:border-darkGray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 dark:text-neutral-300 mb-2">
                    {t('menu.backgroundColor', 'Background Color')}
                  </label>
                  <input
                    type="color"
                    value={customization.backgroundColor}
                    onChange={(e) => setCustomization(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-neutral-300 dark:border-darkGray-700"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customization.showImages}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showImages: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <span className="ml-2 text-sm text-primary-700 dark:text-neutral-300">
                      {t('menu.showImages', 'Show Images')}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customization.showDescriptions}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showDescriptions: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <span className="ml-2 text-sm text-primary-700 dark:text-neutral-300">
                      {t('menu.showDescriptions', 'Show Descriptions')}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customization.showPrices}
                      onChange={(e) => setCustomization(prev => ({ ...prev, showPrices: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <span className="ml-2 text-sm text-primary-700 dark:text-neutral-300">
                      {t('menu.showPrices', 'Show Prices')}
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customization.compactMode}
                      onChange={(e) => setCustomization(prev => ({ ...prev, compactMode: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <span className="ml-2 text-sm text-primary-700 dark:text-neutral-300">
                      {t('menu.compactMode', 'Compact Mode')}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Menu Preview */}
          <div className="flex-1 p-6 bg-neutral-50 dark:bg-darkGray-900 flex items-center justify-center">
            <div className={getContainerClasses()}>
              <div 
                className={`${getStyleClasses()} h-full overflow-y-auto`}
                style={{ 
                  backgroundColor: customization.backgroundColor,
                  color: customization.primaryColor 
                }}
              >
                {/* Menu Header */}
                <div className="p-6 text-center border-b border-gray-200">
                  <h1 className="text-2xl font-bold mb-2">
                    {t('restaurant.name', 'Restaurant Name')}
                  </h1>
                  <p className="text-sm opacity-75">
                    {t('menu.welcomeMessage', 'Welcome to our menu')}
                  </p>
                </div>

                {/* Menu Categories */}
                <div className="p-4">
                  {categories.map((category) => {
                    const categoryItems = getCategoryItems(category.id);
                    if (categoryItems.length === 0) return null;

                    return (
                      <div key={category.id} className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">
                          {category.name}
                        </h2>
                        
                        <div className={`grid gap-4 ${
                          viewMode === 'mobile' 
                            ? 'grid-cols-1' 
                            : customization.compactMode 
                              ? 'grid-cols-2 lg:grid-cols-3' 
                              : 'grid-cols-1 md:grid-cols-2'
                        }`}>
                          {categoryItems.map((item) => (
                            <div 
                              key={item.id} 
                              className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${
                                customization.compactMode ? 'p-3' : 'p-4'
                              }`}
                            >
                              <div className={`flex ${viewMode === 'mobile' || customization.compactMode ? 'flex-col' : 'flex-row'} gap-3`}>
                                {customization.showImages && item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className={`object-cover rounded-md ${
                                      viewMode === 'mobile' || customization.compactMode
                                        ? 'w-full h-32'
                                        : 'w-20 h-20 flex-shrink-0'
                                    }`}
                                  />
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-medium ${customization.compactMode ? 'text-sm' : 'text-base'}`}>
                                      {item.name}
                                    </h3>
                                    {customization.showPrices && (
                                      <span className={`font-semibold text-green-600 ${customization.compactMode ? 'text-sm' : 'text-base'}`}>
                                        {formatPrice(item.price)}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {customization.showDescriptions && item.description && (
                                    <p className={`text-gray-600 ${customization.compactMode ? 'text-xs' : 'text-sm'} line-clamp-2`}>
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuVisualization;
