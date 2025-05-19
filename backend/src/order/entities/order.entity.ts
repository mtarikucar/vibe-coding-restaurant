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

export enum OrderStatus {
  PENDING = "pending",
  PREPARING = "preparing",
  READY = "ready",
  SERVED = "served",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
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

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
