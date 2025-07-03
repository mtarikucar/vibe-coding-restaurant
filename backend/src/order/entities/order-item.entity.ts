import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Order } from "./order.entity";
import { MenuItem } from "../../menu/entities/menu-item.entity";
import { OrderItemModifier } from "./order-item-modifier.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";

export enum OrderItemStatus {
  PENDING = "pending",
  PREPARING = "preparing",
  READY = "ready",
  SERVED = "served",
  CANCELLED = "cancelled",
}

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn()
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.orderItems)
  @JoinColumn()
  menuItem: MenuItem;

  @Column()
  menuItemId: string;

  @Column()
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  basePrice: number; // Original menu item price

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  modifierPrice: number; // Total price of modifiers

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number; // Final price (basePrice + modifierPrice) * quantity

  @Column({
    type: "enum",
    enum: OrderItemStatus,
    default: OrderItemStatus.PENDING,
  })
  status: OrderItemStatus;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  specialInstructions: string;

  @Column({ nullable: true })
  estimatedPrepTime: number; // in minutes

  @Column({ nullable: true })
  actualPrepTime: number; // in minutes

  @Column({ nullable: true })
  startedAt: Date; // When preparation started

  @Column({ nullable: true })
  readyAt: Date; // When item was ready

  @Column({ nullable: true })
  servedAt: Date; // When item was served

  @OneToMany(() => OrderItemModifier, (modifier) => modifier.orderItem, {
    cascade: true,
  })
  modifiers: OrderItemModifier[];

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
