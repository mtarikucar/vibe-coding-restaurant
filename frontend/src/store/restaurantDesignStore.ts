import { create } from 'zustand';

export type ObjectType = 
  | 'table-2' | 'table-4' | 'table-6' | 'table-8'
  | 'chair' | 'booth'
  | 'kitchen-counter' | 'stove' | 'refrigerator' | 'prep-station'
  | 'cashier-desk' | 'pos-terminal'
  | 'storage-shelf' | 'storage-cabinet'
  | 'plant' | 'decoration'
  | 'wall' | 'door' | 'window'
  | 'bar' | 'bar-stool';

export interface RestaurantObject {
  id: string;
  type: ObjectType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color?: string;
  customProps?: Record<string, any>;
}

export interface RestaurantLayout {
  id: string;
  name: string;
  objects: RestaurantObject[];
  floorSize: [number, number];
  floorTexture?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RestaurantDesignState {
  // Edit mode state
  isEditMode: boolean;
  selectedObjectId: string | null;
  draggedObjectId: string | null;
  
  // Current layout
  currentLayout: RestaurantLayout;
  savedLayouts: RestaurantLayout[];
  
  // UI state
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  showObjectNames: boolean;
  activeCategory: ObjectType | 'all';
  
  // Actions
  toggleEditMode: () => void;
  selectObject: (id: string | null) => void;
  setDraggedObject: (id: string | null) => void;
  
  // Object management
  addObject: (type: ObjectType, position: [number, number, number]) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<RestaurantObject>) => void;
  duplicateObject: (id: string) => void;
  
  // Layout management
  saveLayout: (name: string) => void;
  loadLayout: (id: string) => void;
  newLayout: () => void;
  exportLayout: () => string;
  importLayout: (data: string) => void;
  
  // Settings
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setActiveCategory: (category: ObjectType | 'all') => void;
  
  // Utilities
  getObjectById: (id: string) => RestaurantObject | undefined;
  getObjectsInArea: (minX: number, minZ: number, maxX: number, maxZ: number) => RestaurantObject[];
}

// Object templates
export const objectTemplates: Record<ObjectType, Partial<RestaurantObject>> = {
  'table-2': { scale: [1, 1, 1], color: '#ffd3a5' },
  'table-4': { scale: [1.2, 1, 1.2], color: '#ffd3a5' },
  'table-6': { scale: [1.5, 1, 1], color: '#ffd3a5' },
  'table-8': { scale: [1.8, 1, 1.2], color: '#ffd3a5' },
  'chair': { scale: [0.8, 0.8, 0.8], color: '#ffe4e6' },
  'booth': { scale: [2, 1.2, 1], color: '#f3e8ff' },
  'kitchen-counter': { scale: [3, 0.8, 1.5], color: '#f1f5f9' },
  'stove': { scale: [1, 0.8, 1], color: '#e2e8f0' },
  'refrigerator': { scale: [1, 2, 1], color: '#f8fafc' },
  'prep-station': { scale: [1.5, 0.8, 1], color: '#fde68a' },
  'cashier-desk': { scale: [2.5, 0.8, 1.2], color: '#f1f5f9' },
  'pos-terminal': { scale: [0.3, 0.2, 0.3], color: '#e2e8f0' },
  'storage-shelf': { scale: [1, 2, 0.4], color: '#e5e7eb' },
  'storage-cabinet': { scale: [1, 1, 0.6], color: '#f3f4f6' },
  'plant': { scale: [0.5, 1, 0.5], color: '#bbf7d0' },
  'decoration': { scale: [0.8, 0.8, 0.8], color: '#fed7d7' },
  'wall': { scale: [4, 3, 0.2], color: '#e2e8f0' },
  'door': { scale: [1, 2, 0.1], color: '#8b5a3c' },
  'window': { scale: [2, 1.5, 0.1], color: '#bfdbfe' },
  'bar': { scale: [4, 1.2, 0.8], color: '#8b5cf6' },
  'bar-stool': { scale: [0.6, 1.2, 0.6], color: '#ddd6fe' },
};

const generateId = () => `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultLayout: RestaurantLayout = {
  id: 'default',
  name: 'Default Layout',
  objects: [
    {
      id: 'table_1',
      type: 'table-4',
      position: [-3, 0, 3],
      rotation: [0, 0, 0],
      scale: [1.2, 1, 1.2],
      color: '#ffd3a5',
    },
    {
      id: 'table_2',
      type: 'table-4',
      position: [3, 0, 3],
      rotation: [0, 0, 0],
      scale: [1.2, 1, 1.2],
      color: '#ffd3a5',
    },
  ],
  floorSize: [20, 16],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const useRestaurantDesignStore = create<RestaurantDesignState>((set, get) => ({
  // Initial state
  isEditMode: false,
  selectedObjectId: null,
  draggedObjectId: null,
  currentLayout: defaultLayout,
  savedLayouts: [defaultLayout],
  showGrid: true,
  gridSize: 1,
  snapToGrid: true,
  showObjectNames: false,
  activeCategory: 'all',
  
  // Mode management
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  selectObject: (id) => set({ selectedObjectId: id }),
  setDraggedObject: (id) => set({ draggedObjectId: id }),
  
  // Object management
  addObject: (type, position) => {
    const template = objectTemplates[type];
    const newObject: RestaurantObject = {
      id: generateId(),
      type,
      position,
      rotation: [0, 0, 0],
      scale: template.scale || [1, 1, 1],
      color: template.color,
      ...template,
    };
    
    set((state) => ({
      currentLayout: {
        ...state.currentLayout,
        objects: [...state.currentLayout.objects, newObject],
        updatedAt: new Date(),
      },
      selectedObjectId: newObject.id,
    }));
  },
  
  removeObject: (id) => set((state) => ({
    currentLayout: {
      ...state.currentLayout,
      objects: state.currentLayout.objects.filter(obj => obj.id !== id),
      updatedAt: new Date(),
    },
    selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
  })),
  
  updateObject: (id, updates) => set((state) => ({
    currentLayout: {
      ...state.currentLayout,
      objects: state.currentLayout.objects.map(obj =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
      updatedAt: new Date(),
    },
  })),
  
  duplicateObject: (id) => {
    const state = get();
    const original = state.getObjectById(id);
    if (original) {
      const duplicate: RestaurantObject = {
        ...original,
        id: generateId(),
        position: [
          original.position[0] + 2,
          original.position[1],
          original.position[2],
        ],
      };
      
      set((state) => ({
        currentLayout: {
          ...state.currentLayout,
          objects: [...state.currentLayout.objects, duplicate],
          updatedAt: new Date(),
        },
        selectedObjectId: duplicate.id,
      }));
    }
  },
  
  // Layout management
  saveLayout: (name) => {
    const state = get();
    const newLayout: RestaurantLayout = {
      ...state.currentLayout,
      id: generateId(),
      name,
      updatedAt: new Date(),
    };
    
    set((state) => ({
      savedLayouts: [...state.savedLayouts, newLayout],
      currentLayout: newLayout,
    }));
  },
  
  loadLayout: (id) => {
    const state = get();
    const layout = state.savedLayouts.find(l => l.id === id);
    if (layout) {
      set({ currentLayout: layout });
    }
  },
  
  newLayout: () => set({
    currentLayout: {
      id: generateId(),
      name: 'New Layout',
      objects: [],
      floorSize: [20, 16],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    selectedObjectId: null,
  }),
  
  exportLayout: () => {
    const state = get();
    return JSON.stringify(state.currentLayout, null, 2);
  },
  
  importLayout: (data) => {
    try {
      const layout = JSON.parse(data) as RestaurantLayout;
      layout.id = generateId();
      layout.updatedAt = new Date();
      
      set((state) => ({
        currentLayout: layout,
        savedLayouts: [...state.savedLayouts, layout],
      }));
    } catch (error) {
      console.error('Failed to import layout:', error);
    }
  },
  
  // Settings
  setShowGrid: (show) => set({ showGrid: show }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setGridSize: (size) => set({ gridSize: size }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  
  // Utilities
  getObjectById: (id) => {
    const state = get();
    return state.currentLayout.objects.find(obj => obj.id === id);
  },
  
  getObjectsInArea: (minX, minZ, maxX, maxZ) => {
    const state = get();
    return state.currentLayout.objects.filter(obj => {
      const [x, , z] = obj.position;
      return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
    });
  },
}));