import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Tenant } from "../../tenant/entities/tenant.entity";
import { User } from "../../auth/entities/user.entity";
import { Supplier } from "./supplier.entity";
import { PurchaseOrderItem } from "./purchase-order-item.entity";

export enum PurchaseOrderStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  ORDERED = "ordered",
  PARTIALLY_RECEIVED = "partially_received",
  RECEIVED = "received",
  CANCELED = "canceled",
}

@Entity()
export class PurchaseOrder {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  orderNumber: string;

  @Column({
    type: "enum",
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: "supplierId" })
  supplier: Supplier;

  @Column()
  supplierId: string;

  @Column({ nullable: true })
  expectedDeliveryDate: Date;

  @Column({ nullable: true })
  deliveryDate: Date;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  shippingAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  internalNotes: string;

  @Column({ nullable: true })
  paymentTerms: string;

  @Column({ nullable: true })
  shippingMethod: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  invoiceDate: Date;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paidDate: Date;

  @Column({ default: false })
  isDeleted: boolean;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, {
    cascade: true,
  })
  items: PurchaseOrderItem[];

  // Tenant relationship
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenantId" })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  // Created by relationship
  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  // Last updated by relationship
  @ManyToOne(() => User)
  @JoinColumn({ name: "lastUpdatedById" })
  lastUpdatedBy: User;

  @Column({ nullable: true })
  lastUpdatedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
