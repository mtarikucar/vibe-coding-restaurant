export enum StockActionType {
  INCREASE = "increase",
  DECREASE = "decrease",
  ADJUSTMENT = "adjustment",
  PURCHASE = "purchase",
  SALE = "sale",
  RETURN = "return",
  WASTE = "waste",
  TRANSFER = "transfer",
  INVENTORY_COUNT = "inventory_count",
  EXPIRY = "expiry",
  DAMAGE = "damage",
  PRODUCTION = "production",
}

export enum PurchaseOrderStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  ORDERED = "ordered",
  PARTIALLY_RECEIVED = "partially_received",
  RECEIVED = "received",
  CANCELED = "canceled",
}

export interface MenuItem {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
  };
}

export interface Stock {
  id: string;
  menuItem: MenuItem;
  menuItemId: string;
  quantity: number;
  minQuantity: number;
  criticalQuantity: number;
  optimalQuantity: number;
  isLowStock: boolean;
  isCriticalStock: boolean;
  unit: string;
  sku: string;
  barcode: string;
  location: string;
  costPerUnit: number;
  supplier: string;
  supplierContact: string;
  leadTime: number;
  lastOrderDate: string;
  nextOrderDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockHistory {
  id: string;
  stockId: string;
  actionType: StockActionType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  userId: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
  };
  orderId?: string;
  order?: {
    id: string;
    orderNumber: string;
  };
  notes?: string;
  createdAt: string;
}

export interface StockUsage {
  stock: Stock;
  totalUsage: number;
  usageByDay: Record<string, number>;
  history: StockHistory[];
}

export interface StockForecast {
  stock: Stock;
  currentStock: number;
  minStock: number;
  avgDailyUsage: number;
  daysUntilMin: number | null;
  daysUntilDepleted: number | null;
  recommendedOrderQty: number;
  pendingOrderQuantity: number;
  forecastDate: string;
}

export interface StockValue {
  id: string;
  menuItemId: string;
  quantity: number;
  costPerUnit: number;
  value: number;
}

export interface StockValuation {
  totalValue: number;
  stockValues: StockValue[];
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id?: string;
  purchaseOrderId?: string;
  stockId: string;
  stock?: Stock;
  name: string;
  sku?: string;
  quantity: number;
  receivedQuantity?: number;
  unitPrice: number;
  taxRate?: number;
  discountAmount?: number;
  totalPrice?: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: PurchaseOrderStatus;
  supplier: Supplier;
  supplierId: string;
  expectedDeliveryDate?: string;
  deliveryDate?: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  internalNotes?: string;
  paymentTerms?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  isPaid: boolean;
  paidDate?: string;
  items: PurchaseOrderItem[];
  createdBy?: {
    id: string;
    username: string;
    fullName: string;
  };
  lastUpdatedBy?: {
    id: string;
    username: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  taxId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {
  isDeleted?: boolean;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  expectedDeliveryDate?: string;
  notes?: string;
  internalNotes?: string;
  paymentTerms?: string;
  shippingMethod?: string;
  shippingAmount?: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  items: PurchaseOrderItem[];
}

export interface UpdatePurchaseOrderDto extends Partial<Omit<CreatePurchaseOrderDto, 'supplierId'>> {
  status?: PurchaseOrderStatus;
  deliveryDate?: string;
  trackingNumber?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  isPaid?: boolean;
  paidDate?: string;
  isDeleted?: boolean;
}

export interface AdjustStockDto {
  quantity: number;
  actionType: StockActionType;
  userId: string;
  orderId?: string;
  notes?: string;
}

export interface ReceivePurchaseOrderDto {
  items: {
    id: string;
    receivedQuantity: number;
  }[];
}
