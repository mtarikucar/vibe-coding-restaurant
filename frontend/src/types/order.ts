// Define User interface directly to avoid import issues
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  WAITER = "waiter",
  KITCHEN = "kitchen",
  CASHIER = "cashier",
  CUSTOMER = "customer",
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// Define Table interface directly to avoid import issues
export enum TableStatus {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  RESERVED = "reserved",
  MAINTENANCE = "maintenance",
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// Define MenuItem interface directly to avoid import issues
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  categoryId: string;
  isAvailable: boolean;
  preparationTime?: number;
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = "pending",
  PREPARING = "preparing",
  READY = "ready",
  SERVED = "served",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum OrderItemStatus {
  PENDING = "pending",
  PREPARING = "preparing",
  READY = "ready",
  SERVED = "served",
  CANCELLED = "cancelled",
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItem: MenuItem;
  menuItemId: string;
  quantity: number;
  price: number;
  status: OrderItemStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  waiter: User;
  waiterId: string;
  table: Table;
  tableId: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
