import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { Subscription } from "../../subscription/entities/subscription.entity";

export enum TenantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  TRIAL = "trial",
  EXPIRED = "expired",
}

export enum PaymentProvider {
  STRIPE = "stripe",
  IYZICO = "iyzico",
  PAYPAL = "paypal",
  MANUAL = "manual",
}

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  schema: string;

  @Column({ unique: true, nullable: true })
  subdomain: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  currency: string;

  @Column({
    type: "enum",
    enum: TenantStatus,
    default: TenantStatus.TRIAL,
  })
  status: TenantStatus;

  @Column({ nullable: true })
  trialStartDate: Date;

  @Column({ nullable: true })
  trialEndDate: Date;

  @Column({ nullable: true })
  subscriptionId: string;

  // Subscription relationship
  @OneToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: "subscriptionId" })
  subscription: Subscription;

  // Payment provider preference
  @Column({
    type: "enum",
    enum: PaymentProvider,
    nullable: true,
  })
  preferredPaymentProvider: PaymentProvider;

  // Billing information
  @Column({ nullable: true, type: "jsonb" })
  billingDetails: Record<string, any>;

  // Payment method information
  @Column({ nullable: true, type: "jsonb" })
  paymentMethods: Record<string, any>;

  // Subscription limits and features
  @Column({ nullable: true, type: "jsonb" })
  subscriptionLimits: Record<string, any>;

  // Business information
  @Column({ nullable: true })
  businessType: string;

  @Column({ nullable: true })
  taxNumber: string;

  @Column({ nullable: true })
  website: string;

  // Notification preferences
  @Column({ nullable: true, type: "jsonb" })
  notificationSettings: Record<string, any>;

  // Theme and customization
  @Column({ nullable: true, type: "jsonb" })
  themeSettings: Record<string, any>;

  // Last activity tracking
  @Column({ nullable: true })
  lastActivityAt: Date;

  // Suspension details
  @Column({ nullable: true })
  suspendedAt: Date;

  @Column({ nullable: true })
  suspensionReason: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true, type: "jsonb" })
  settings: Record<string, any>;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
