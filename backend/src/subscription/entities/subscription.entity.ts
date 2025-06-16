import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
  TRIAL = 'trial',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  IYZICO = 'iyzico',
  MANUAL = 'manual',
}

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  // Tenant relationship
  @ManyToOne(() => Tenant)
  @JoinColumn()
  tenant: Tenant;

  @Column()
  tenantId: string;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn()
  plan: SubscriptionPlan;

  @Column()
  planId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ nullable: true })
  canceledAt: Date;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ nullable: true })
  subscriptionId: string; // External subscription ID from payment provider

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    nullable: true,
  })
  paymentProvider: PaymentProvider;

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails: Record<string, any>;

  @Column({ nullable: true })
  lastPaymentDate: Date;

  @Column({ nullable: true })
  nextPaymentDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ default: 'usd' })
  currency: string;

  // Billing and invoice information
  @Column({ nullable: true, type: 'jsonb' })
  billingAddress: Record<string, any>;

  @Column({ nullable: true })
  invoiceEmail: string;

  // Discount and coupon information
  @Column({ nullable: true })
  discountCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountAmount: number;

  // Usage tracking
  @Column({ nullable: true, type: 'jsonb' })
  usageMetrics: Record<string, any>;

  // Cancellation details
  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  canceledBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
