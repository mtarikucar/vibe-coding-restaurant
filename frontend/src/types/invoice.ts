// Define Order interface directly to avoid import issues
export interface Order {
 id: string;
 orderNumber: string;
 totalAmount: number;
 status: string;
 items: Array<{
  id: string;
  menuItem: {
   id: string;
   name: string;
   price: number;
  };
  quantity: number;
  price: number;
 }>;
 table: {
  id: string;
  number: number;
 };
 waiter: {
  id: string;
  fullName: string;
 };
 createdAt: string;
 updatedAt: string;
 completedAt?: string;
}

// Define Payment interface directly to avoid import issues
export interface Payment {
 id: string;
 amount: number;
 method: string;
 status: string;
 transactionId?: string;
 createdAt: string;
 updatedAt: string;
}

// Define User interface directly to avoid import issues
export interface User {
 id: string;
 fullName: string;
 email: string;
 role: string;
}

export enum InvoiceStatus {
 DRAFT ="draft",
 ISSUED ="issued",
 PAID ="paid",
 CANCELLED ="cancelled",
}

export enum InvoiceType {
 STANDARD ="standard",
 PROFORMA ="proforma",
 CREDIT ="credit",
}

export interface Invoice {
 id: string;
 invoiceNumber: string;
 order: Order;
 orderId: string;
 payment?: Payment;
 paymentId?: string;
 status: InvoiceStatus;
 type: InvoiceType;
 issueDate: string;
 dueDate?: string;
 subtotal: number;
 taxAmount: number;
 discountAmount: number;
 totalAmount: number;
 notes?: string;
 customerName?: string;
 customerAddress?: string;
 customerTaxId?: string;
 customerEmail?: string;
 customerPhone?: string;
 fileUrl?: string;
 createdBy: User;
 createdById: string;
 tenantId: string;
 createdAt: string;
 updatedAt: string;
}
