import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Order } from "../../order/entities/order.entity";
import { User } from "../../auth/entities/user.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";

export enum PaymentMethod {
  CASH = "cash",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  STRIPE = "stripe",
  PAYPAL = "paypal",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => Order, (order) => order.payment)
  @JoinColumn()
  order: Order;

  @Column()
  orderId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: "enum",
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  method: PaymentMethod;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  paymentIntentId: string;

  @Column({ nullable: true })
  paymentMethodId: string;

  @Column({ type: "jsonb", nullable: true })
  paymentDetails: Record<string, any>;

  @Column({ nullable: true })
  receiptUrl: string;

  @Column({ nullable: true })
  cashierId: string;

  // Tenant relationship
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenantId" })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
