import { create } from 'zustand';

export interface TableStatus {
  id: number;
  status: 'available' | 'occupied' | 'cleaning' | 'reserved';
  customers: number;
  orderCount: number;
}

export interface StaffMember {
  id: number;
  name: string;
  role: 'waiter' | 'chef' | 'cashier' | 'cleaner';
  status: 'active' | 'break' | 'offline';
  position: [number, number, number];
}

export interface KitchenData {
  pendingOrders: number;
  cookingOrders: number;
  readyOrders: number;
  averageCookTime: number;
}

export interface StockData {
  totalItems: number;
  lowStockItems: number;
  criticalItems: number;
  lastUpdated: Date;
}

export interface CashierData {
  queueLength: number;
  dailyRevenue: number;
  transactionsToday: number;
  averageWaitTime: number;
}

interface ControlPanelState {
  tables: TableStatus[];
  staff: StaffMember[];
  kitchen: KitchenData;
  stock: StockData;
  cashier: CashierData;
  
  // Actions
  updateTableStatus: (id: number, status: TableStatus['status']) => void;
  updateStaffStatus: (id: number, status: StaffMember['status']) => void;
  updateKitchen: (data: Partial<KitchenData>) => void;
  updateStock: (data: Partial<StockData>) => void;
  updateCashier: (data: Partial<CashierData>) => void;
  simulateRealTimeUpdates: () => void;
}

export const useControlPanelStore = create<ControlPanelState>((set, get) => ({
  tables: [
    { id: 1, status: 'available', customers: 0, orderCount: 0 },
    { id: 2, status: 'occupied', customers: 4, orderCount: 2 },
    { id: 3, status: 'occupied', customers: 2, orderCount: 1 },
    { id: 4, status: 'cleaning', customers: 0, orderCount: 0 },
    { id: 5, status: 'reserved', customers: 0, orderCount: 0 },
    { id: 6, status: 'available', customers: 0, orderCount: 0 },
    { id: 7, status: 'occupied', customers: 3, orderCount: 3 },
    { id: 8, status: 'available', customers: 0, orderCount: 0 },
  ],
  
  staff: [
    { id: 1, name: 'Alice', role: 'waiter', status: 'active', position: [2, 0, 1] },
    { id: 2, name: 'Bob', role: 'chef', status: 'active', position: [-3, 0, -2] },
    { id: 3, name: 'Carol', role: 'cashier', status: 'active', position: [4, 0, -1] },
    { id: 4, name: 'Dave', role: 'waiter', status: 'break', position: [0, 0, 3] },
    { id: 5, name: 'Eve', role: 'cleaner', status: 'active', position: [1, 0, 2] },
  ],
  
  kitchen: {
    pendingOrders: 7,
    cookingOrders: 4,
    readyOrders: 2,
    averageCookTime: 12,
  },
  
  stock: {
    totalItems: 145,
    lowStockItems: 8,
    criticalItems: 3,
    lastUpdated: new Date(),
  },
  
  cashier: {
    queueLength: 3,
    dailyRevenue: 2840,
    transactionsToday: 47,
    averageWaitTime: 2.5,
  },
  
  updateTableStatus: (id, status) =>
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === id ? { ...table, status } : table
      ),
    })),
    
  updateStaffStatus: (id, status) =>
    set((state) => ({
      staff: state.staff.map((member) =>
        member.id === id ? { ...member, status } : member
      ),
    })),
    
  updateKitchen: (data) =>
    set((state) => ({
      kitchen: { ...state.kitchen, ...data },
    })),
    
  updateStock: (data) =>
    set((state) => ({
      stock: { ...state.stock, ...data },
    })),
    
  updateCashier: (data) =>
    set((state) => ({
      cashier: { ...state.cashier, ...data },
    })),
    
  simulateRealTimeUpdates: () => {
    const state = get();
    
    // Simulate random updates every few seconds
    setTimeout(() => {
      // Random kitchen updates
      const kitchenUpdate = {
        pendingOrders: Math.floor(Math.random() * 10) + 1,
        cookingOrders: Math.floor(Math.random() * 6) + 1,
        readyOrders: Math.floor(Math.random() * 4),
      };
      
      // Random cashier updates
      const cashierUpdate = {
        queueLength: Math.floor(Math.random() * 6),
        dailyRevenue: state.cashier.dailyRevenue + Math.floor(Math.random() * 100),
        transactionsToday: state.cashier.transactionsToday + 1,
      };
      
      // Random stock updates
      const stockUpdate = {
        lowStockItems: Math.floor(Math.random() * 12),
        criticalItems: Math.floor(Math.random() * 5),
        lastUpdated: new Date(),
      };
      
      set((state) => ({
        kitchen: { ...state.kitchen, ...kitchenUpdate },
        cashier: { ...state.cashier, ...cashierUpdate },
        stock: { ...state.stock, ...stockUpdate },
      }));
      
      // Continue simulation
      state.simulateRealTimeUpdates();
    }, 3000 + Math.random() * 2000); // Random interval between 3-5 seconds
  },
}));