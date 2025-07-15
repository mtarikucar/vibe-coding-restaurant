import { useTranslation } from 'react-i18next';
import { Suspense } from 'react';
import RestaurantScene from '../../components/3d/RestaurantScene';
import SimpleScene from '../../components/3d/SimpleScene';
import MinimalRestaurant from '../../components/3d/MinimalRestaurant';
import DebugScene from '../../components/3d/DebugScene';
import { SceneErrorBoundary } from '../../components/3d/SceneErrorBoundary';
import { useControlPanelStore } from '../../store/controlPanelStore';

export default function ControlPanel() {
  const { t } = useTranslation();
  const { kitchen, stock, cashier, tables, staff } = useControlPanelStore();

  const occupiedTables = tables.filter(table => table.status === 'occupied').length;
  const totalOrders = kitchen.pendingOrders + kitchen.cookingOrders + kitchen.readyOrders;
  const activeStaff = staff.filter(member => member.status === 'active').length;
  const criticalStock = stock.criticalItems;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('controlPanel.title', 'Control Panel')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('controlPanel.subtitle', 'Real-time restaurant operations overview')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Occupied Tables</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{occupiedTables}/{tables.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeStaff}/{staff.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${criticalStock > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <svg className={`w-6 h-6 ${criticalStock > 0 ? 'text-red-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 21V9a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1H10a1 1 0 01-1-1z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Stock</p>
              <p className={`text-2xl font-bold ${criticalStock > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {criticalStock}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Restaurant Scene */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('controlPanel.restaurantOverview', 'Restaurant Overview')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('controlPanel.sceneDescription', 'Interactive 3D view of your restaurant operations')}
          </p>
        </div>
        <div className="h-[600px] bg-gradient-to-b from-blue-50 to-blue-100">
          <SceneErrorBoundary>
            <Suspense 
              fallback={
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading 3D scene...</p>
                  </div>
                </div>
              }
            >
              <RestaurantScene />
            </Suspense>
          </SceneErrorBoundary>
        </div>
      </div>

      {/* Controls and Legend */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('controlPanel.legend', 'Legend')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-200 rounded mr-3"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Available Tables</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-400 rounded mr-3"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Occupied Tables</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 rounded mr-3"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Cleaning</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-200 rounded mr-3"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Reserved Tables</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('controlPanel.controls', 'Controls')}
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>🖱️ <strong>Mouse:</strong> Rotate view</p>
            <p>🔍 <strong>Scroll:</strong> Zoom in/out</p>
            <p>👆 <strong>Drag:</strong> Pan around</p>
            <p>📊 <strong>Tags:</strong> Show real-time data</p>
          </div>
        </div>
      </div>
    </div>
  );
}