import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { PurchaseOrder } from "./purchase-order.entity";
import { Stock } from "./stock.entity";

export enum PurchaseOrderItemStatus {
  PENDING = "pending",
  PARTIALLY_RECEIVED = "partially_received",
  RECEIVED = "received",
  CANCELED = "canceled",
}

@Entity()
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => PurchaseOrder, (purchaseOrder) => purchaseOrder.items)
  @JoinColumn({ name: "purchaseOrderId" })
  purchaseOrder: PurchaseOrder;

  @Column()
  purchaseOrderId: string;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: "stockId" })
  stock: Stock;

  @Column()
  stockId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  receivedQuantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  taxRate: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: "enum",
    enum: PurchaseOrderItemStatus,
    default: PurchaseOrderItemStatus.PENDING,
  })
  status: PurchaseOrderItemStatus;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
