import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FeatureFlagType {
  BOOLEAN = 'boolean',
  STRING = 'string',
  NUMBER = 'number',
  JSON = 'json',
}

export enum FeatureFlagStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
}

export enum PlanLevel {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Entity()
@Index(['key'])
@Index(['status', 'planLevel'])
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: FeatureFlagType,
    default: FeatureFlagType.BOOLEAN,
  })
  type: FeatureFlagType;

  @Column({
    type: 'enum',
    enum: FeatureFlagStatus,
    default: FeatureFlagStatus.ACTIVE,
  })
  status: FeatureFlagStatus;

  @Column({
    type: 'enum',
    enum: PlanLevel,
    default: PlanLevel.FREE,
  })
  planLevel: PlanLevel;

  // Default value for the feature flag
  @Column({ type: 'jsonb', nullable: true })
  defaultValue: any;

  // Plan-specific values
  @Column({ type: 'jsonb', nullable: true })
  planValues: Record<string, any>;

  // User-specific overrides
  @Column({ type: 'jsonb', nullable: true })
  userOverrides: Record<string, any>;

  // Tenant-specific overrides
  @Column({ type: 'jsonb', nullable: true })
  tenantOverrides: Record<string, any>;

  // Feature rollout percentage (0-100)
  @Column({ type: 'int', default: 100 })
  rolloutPercentage: number;

  // Tags for organizing features
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}