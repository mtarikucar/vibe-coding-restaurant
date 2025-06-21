// Define Order interface directly to avoid import issues
export interface Order {
 id: string;
 orderNumber: string;
 totalAmount: number;
 status: string;
 createdAt: string;
 updatedAt: string;
}

// Define User interface directly to avoid import issues
export interface User {
 id: string;
 fullName: string;
}

export enum PaymentMethod {
 CASH ="cash",
 CREDIT_CARD ="credit_card",
 DEBIT_CARD ="debit_card",
 STRIPE ="stripe",
 PAYPAL ="paypal",
 IYZICO ="iyzico",
}

export enum PaymentStatus {
 PENDING ="pending",
 COMPLETED ="completed",
 FAILED ="failed",
 REFUNDED ="refunded",
}

export interface Payment {
 id: string;
 order: Order;
 orderId: string;
 amount: number;
 method: PaymentMethod;
 status: PaymentStatus;
 transactionId?: string;
 paymentIntentId?: string;
 paymentMethodId?: string;
 paymentDetails?: Record<string, any>;
 receiptUrl?: string;
 cashierId?: string;
 createdAt: string;
 updatedAt: string;
}
