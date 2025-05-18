import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Stock } from "./stock.entity";
import { User } from "../../auth/entities/user.entity";
import { Order } from "../../order/entities/order.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";

export enum StockActionType {
  INCREASE = "increase",
  DECREASE = "decrease",
  ADJUSTMENT = "adjustment",
  PURCHASE = "purchase",
  SALE = "sale",
  RETURN = "return",
  WASTE = "waste",
  TRANSFER = "transfer",
  INVENTORY_COUNT = "inventory_count",
  EXPIRY = "expiry",
  DAMAGE = "damage",
  PRODUCTION = "production",
}

@Entity()
export class StockHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Stock, (stock) => stock.history)
  @JoinColumn()
  stock: Stock;

  @Column()
  stockId: string;

  @Column({
    type: "enum",
    enum: StockActionType,
  })
  actionType: StockActionType;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  previousQuantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  newQuantity: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn()
  order: Order;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  notes: string;

  // Tenant relationship
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenantId" })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ nullable: true, type: "jsonb" })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
