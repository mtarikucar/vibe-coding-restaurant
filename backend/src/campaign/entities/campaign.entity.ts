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
import { User } from "../../auth/entities/user.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";

export enum CampaignType {
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount",
  BUY_X_GET_Y = "buy_x_get_y",
  FREE_ITEM = "free_item",
}

export enum CampaignStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SCHEDULED = "scheduled",
  EXPIRED = "expired",
}

export enum CampaignApplicability {
  ALL_ITEMS = "all_items",
  SPECIFIC_ITEMS = "specific_items",
  SPECIFIC_CATEGORIES = "specific_categories",
}

@Entity()
export class Campaign {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: CampaignType,
    default: CampaignType.PERCENTAGE,
  })
  type: CampaignType;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  value: number;

  @Column({
    type: "enum",
    enum: CampaignStatus,
    default: CampaignStatus.INACTIVE,
  })
  status: CampaignStatus;

  @Column({
    type: "enum",
    enum: CampaignApplicability,
    default: CampaignApplicability.ALL_ITEMS,
  })
  applicability: CampaignApplicability;

  @Column({ type: "jsonb", nullable: true })
  applicableItems: string[]; // Array of item IDs or category IDs

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ default: false })
  isRecurring: boolean;

  @Column({ type: "jsonb", nullable: true })
  recurringDays: number[]; // 0 = Sunday, 1 = Monday, etc.

  @Column({ nullable: true })
  recurringStartTime: string; // HH:MM format

  @Column({ nullable: true })
  recurringEndTime: string; // HH:MM format

  @Column({ default: false })
  requiresCode: boolean;

  @Column({ nullable: true, unique: true })
  code: string;

  @Column({ default: 0 })
  usageLimit: number; // 0 = unlimited

  @Column({ default: 0 })
  usageCount: number;

  @Column({ default: false })
  isDeleted: boolean;

  // Tenant relationship
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenantId" })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  // Creator relationship
  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
