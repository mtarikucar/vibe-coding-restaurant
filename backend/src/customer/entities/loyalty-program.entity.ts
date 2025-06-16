import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';

export enum LoyaltyProgramType {
  POINTS = 'points',
  VISITS = 'visits',
  SPENDING = 'spending',
}

export enum LoyaltyProgramStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export enum RewardType {
  DISCOUNT_PERCENTAGE = 'discount_percentage',
  DISCOUNT_FIXED = 'discount_fixed',
  FREE_ITEM = 'free_item',
  FREE_DELIVERY = 'free_delivery',
  UPGRADE = 'upgrade',
}

@Entity()
export class LoyaltyProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: LoyaltyProgramType,
    default: LoyaltyProgramType.POINTS,
  })
  type: LoyaltyProgramType;

  @Column({
    type: 'enum',
    enum: LoyaltyProgramStatus,
    default: LoyaltyProgramStatus.ACTIVE,
  })
  status: LoyaltyProgramStatus;

  // Points configuration
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  pointsPerDollar: number; // How many points per dollar spent

  @Column({ default: 100 })
  pointsForReward: number; // Points needed for a reward

  // Visit configuration
  @Column({ default: 10 })
  visitsForReward: number; // Visits needed for a reward

  // Spending configuration
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 100 })
  spendingForReward: number; // Amount to spend for a reward

  // Reward configuration
  @Column({
    type: 'enum',
    enum: RewardType,
    default: RewardType.DISCOUNT_PERCENTAGE,
  })
  rewardType: RewardType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10 })
  rewardValue: number; // Percentage or fixed amount

  @Column({ nullable: true })
  rewardItemId: string; // For free item rewards

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ default: true })
  isAutoApply: boolean; // Automatically apply rewards

  @Column({ default: false })
  requiresCode: boolean; // Requires a code to redeem

  @Column({ nullable: true })
  code: string; // Redemption code

  @Column({ default: 0 })
  maxRedemptions: number; // 0 = unlimited

  @Column({ default: 0 })
  currentRedemptions: number;

  @Column({ type: 'jsonb', nullable: true })
  rules: Record<string, any>; // Additional rules and conditions

  @Column({ type: 'jsonb', nullable: true })
  tiers: Array<{
    name: string;
    minPoints: number;
    benefits: string[];
    multiplier: number;
  }>; // Loyalty tiers

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
