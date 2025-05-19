import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Order } from '../../order/entities/order.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { User } from '../../auth/entities/user.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum InvoiceType {
  STANDARD = 'standard',
  PROFORMA = 'proforma',
  CREDIT = 'credit',
}

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoiceNumber: string;

  @OneToOne(() => Order)
  @JoinColumn()
  order: Order;

  @Column()
  orderId: string;

  @OneToOne(() => Payment)
  @JoinColumn()
  payment: Payment;

  @Column({ nullable: true })
  paymentId: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @Column({
    type: 'enum',
    enum: InvoiceType,
    default: InvoiceType.STANDARD,
  })
  type: InvoiceType;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerAddress: string;

  @Column({ nullable: true })
  customerTaxId: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  fileUrl: string;

  @ManyToOne(() => User)
  @JoinColumn()
  createdBy: User;

  @Column()
  createdById: string;

  @ManyToOne(() => Tenant)
  @JoinColumn()
  tenant: Tenant;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
