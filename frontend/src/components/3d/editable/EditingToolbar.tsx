import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PlusIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  Squares2X2Icon,
  TableCellsIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useRestaurantDesignStore, ObjectType, objectTemplates } from '../../../store/restaurantDesignStore';

const objectCategories = {
  tables: ['table-2', 'table-4', 'table-6', 'table-8', 'booth'] as ObjectType[],
  seating: ['chair', 'bar-stool'] as ObjectType[],
  kitchen: ['kitchen-counter', 'stove', 'refrigerator', 'prep-station'] as ObjectType[],
  service: ['cashier-desk', 'pos-terminal', 'bar'] as ObjectType[],
  storage: ['storage-shelf', 'storage-cabinet'] as ObjectType[],
  decor: ['plant', 'decoration'] as ObjectType[],
  structure: ['wall', 'door', 'window'] as ObjectType[],
};

const categoryIcons = {
  tables: TableCellsIcon,
  seating: HomeIcon,
  kitchen: BuildingStorefrontIcon,
  service: Cog6ToothIcon,
  storage: ArchiveBoxIcon,
  decor: SparklesIcon,
  structure: Squares2X2Icon,
};

export default function EditingToolbar() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<keyof typeof objectCategories>('tables');
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    isEditMode,
    selectedObjectId,
    showGrid,
    snapToGrid,
    gridSize,
    currentLayout,
    toggleEditMode,
    addObject,
    removeObject,
    duplicateObject,
    selectObject,
    updateObject,
    setShowGrid,
    setSnapToGrid,
    setGridSize,
    saveLayout,
    newLayout,
    exportLayout,
    importLayout,
    getObjectById,
  } = useRestaurantDesignStore();
  
  const selectedObject = selectedObjectId ? getObjectById(selectedObjectId) : null;
  
  const handleAddObject = (type: ObjectType) => {
    // Add object at center of view
    addObject(type, [0, 0, 0]);
  };
  
  const handleDeleteSelected = () => {
    if (selectedObjectId) {
      removeObject(selectedObjectId);
    }
  };
  
  const handleDuplicateSelected = () => {
    if (selectedObjectId) {
      duplicateObject(selectedObjectId);
    }
  };
  
  const handleSaveLayout = () => {
    const name = prompt('Enter layout name:');
    if (name) {
      saveLayout(name);
    }
  };
  
  const handleExportLayout = () => {
    const data = exportLayout();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentLayout.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImportLayout = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target?.result as string;
          importLayout(data);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
  
  if (!isEditMode) {
    return (
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleEditMode}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <Cog6ToothIcon className="h-5 w-5" />
          {t('editMode.enable', 'Edit Mode')}
        </button>
      </div>
    );
  }
  
  return (
    <div className="absolute inset-x-4 top-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('editMode.title', 'Restaurant Designer')}
          </h3>
          <span className="text-sm text-gray-500">
            {currentLayout.objects.length} objects
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Object Actions */}
          {selectedObject && (
            <>
              <button
                onClick={handleDuplicateSelected}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Duplicate object"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleDeleteSelected}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete object"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-2" />
            </>
          )}
          
          {/* Layout Actions */}
          <button
            onClick={newLayout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
            title="New layout"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleSaveLayout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
            title="Save layout"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleExportLayout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
            title="Export layout"
          >
            <DocumentArrowUpIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleImportLayout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors"
            title="Import layout"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-200 mx-2" />
          
          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded transition-colors ${
              showSettings 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title="Settings"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
          
          {/* Exit Edit Mode */}
          <button
            onClick={toggleEditMode}
            className="ml-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            {t('editMode.exit', 'Exit')}
          </button>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{t('editMode.showGrid', 'Show Grid')}</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{t('editMode.snapToGrid', 'Snap to Grid')}</span>
            </label>
            
            <label className="flex items-center gap-2">
              <span className="text-sm">{t('editMode.gridSize', 'Grid Size:')}</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={gridSize}
                onChange={(e) => setGridSize(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-500">{gridSize}m</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Category Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {Object.entries(categoryIcons).map(([category, Icon]) => (
          <button
            key={category}
            onClick={() => setActiveTab(category as keyof typeof objectCategories)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === category
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {t(`editMode.categories.${category}`, category)}
          </button>
        ))}
      </div>
      
      {/* Object Library */}
      <div className="p-4">
        <div className="grid grid-cols-8 gap-2">
          {objectCategories[activeTab].map((objectType) => (
            <button
              key={objectType}
              onClick={() => handleAddObject(objectType)}
              className="aspect-square p-3 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-colors group"
              title={t(`objects.${objectType}`, objectType)}
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: objectTemplates[objectType].color }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1 text-center truncate">
                {t(`objects.${objectType}`, objectType.replace('-', ' '))}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Selected Object Info */}
      {selectedObject && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {t(`objects.${selectedObject.type}`, selectedObject.type)}
              </h4>
              <p className="text-sm text-gray-500">
                Position: ({selectedObject.position[0].toFixed(1)}, {selectedObject.position[2].toFixed(1)})
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="color"
                value={selectedObject.color || '#f3f4f6'}
                onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300"
                title="Change color"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}