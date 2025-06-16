import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

export enum CustomerType {
  REGULAR = 'regular',
  VIP = 'vip',
  CORPORATE = 'corporate',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.REGULAR,
  })
  type: CustomerType;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>; // Dietary preferences, favorite items, etc.

  @Column({ type: 'jsonb', nullable: true })
  allergens: string[]; // Customer allergies

  @Column({ default: 0 })
  loyaltyPoints: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ default: 0 })
  visitCount: number;

  @Column({ nullable: true })
  lastVisit: Date;

  @Column({ nullable: true })
  notes: string; // Staff notes about the customer

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isPhoneVerified: boolean;

  @Column({ default: true })
  marketingOptIn: boolean; // Consent for marketing communications

  @Column({ nullable: true })
  referredBy: string; // Customer ID who referred this customer

  @Column({ type: 'jsonb', nullable: true })
  socialMedia: Record<string, string>; // Social media handles

  @OneToMany(() => Order, order => order.customer)
  orders: Order[];

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
