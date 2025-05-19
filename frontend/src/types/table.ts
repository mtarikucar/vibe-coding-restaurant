export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  MAINTENANCE = 'maintenance',
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
