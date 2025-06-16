import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { Table } from "../../table/entities/table.entity";
import { OrderItem } from "./order-item.entity";
import { Payment } from "../../payment/entities/payment.entity";
import { Customer } from "../../customer/entities/customer.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";

export enum OrderStatus {
  PENDING = "pending",
  PREPARING = "preparing",
  READY = "ready",
  SERVED = "served",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum OrderType {
  DINE_IN = "dine_in",
  TAKEAWAY = "takeaway",
  DELIVERY = "delivery",
}

export enum OrderPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  orderNumber: string;

  @ManyToOne(() => User)
  @JoinColumn()
  waiter: User;

  @Column()
  waiterId: string;

  @ManyToOne(() => Table, (table) => table.orders)
  @JoinColumn()
  table: Table;

  @Column()
  tableId: string;

  @ManyToOne(() => Customer, (customer) => customer.orders, { nullable: true })
  @JoinColumn()
  customer: Customer;

  @Column({ nullable: true })
  customerId: string;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: "enum",
    enum: OrderType,
    default: OrderType.DINE_IN,
  })
  type: OrderType;

  @Column({
    type: "enum",
    enum: OrderPriority,
    default: OrderPriority.NORMAL,
  })
  priority: OrderPriority;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  serviceChargeAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  specialInstructions: string;

  @Column({ nullable: true })
  estimatedPrepTime: number; // in minutes

  @Column({ nullable: true })
  actualPrepTime: number; // in minutes

  @Column({ default: 1 })
  guestCount: number;

  @Column({ nullable: true })
  campaignCode: string; // Applied campaign/discount code

  @Column({ type: "jsonb", nullable: true })
  appliedDiscounts: Array<{
    type: string;
    amount: number;
    description: string;
  }>;

  @Column({ default: 0 })
  loyaltyPointsEarned: number;

  @Column({ default: 0 })
  loyaltyPointsUsed: number;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelReason: string;
}
