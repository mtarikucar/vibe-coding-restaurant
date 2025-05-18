import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { MenuItem } from "../../menu/entities/menu-item.entity";
import { StockHistory } from "./stock-history.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";
import { User } from "../../auth/entities/user.entity";

@Entity()
export class Stock {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.stocks)
  @JoinColumn()
  menuItem: MenuItem;

  @Column()
  menuItemId: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  minQuantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  criticalQuantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  optimalQuantity: number;

  @Column({ default: false })
  isLowStock: boolean;

  @Column({ default: false })
  isCriticalStock: boolean;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  barcode: string;

  @Column({ nullable: true })
  location: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  costPerUnit: number;

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  supplierContact: string;

  @Column({ nullable: true })
  leadTime: number; // in days

  @Column({ nullable: true })
  lastOrderDate: Date;

  @Column({ nullable: true })
  nextOrderDate: Date;

  @Column({ nullable: true, type: "jsonb" })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @OneToMany(() => StockHistory, (stockHistory) => stockHistory.stock)
  history: StockHistory[];

  // Tenant relationship
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenantId" })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

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
