export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  WAITER = 'waiter',
  KITCHEN = 'kitchen',
  CASHIER = 'cashier',
  CUSTOMER = 'customer',
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
