import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UsageMetricType {
  TABLE_COUNT = 'table_count',
  USER_COUNT = 'user_count',
  STORAGE_USED = 'storage_used',
  API_CALLS = 'api_calls',
  ORDERS_PROCESSED = 'orders_processed',
  INVOICES_GENERATED = 'invoices_generated',
  RESERVATIONS_MADE = 'reservations_made',
  REPORTS_GENERATED = 'reports_generated',
}

export enum UsageAggregationType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity()
@Index(['tenantId', 'metricType', 'date'])
@Index(['tenantId', 'aggregationType', 'date'])
export class UsageMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: UsageMetricType,
  })
  metricType: UsageMetricType;

  @Column({
    type: 'enum',
    enum: UsageAggregationType,
    default: UsageAggregationType.DAILY,
  })
  aggregationType: UsageAggregationType;

  @Column({ type: 'bigint', default: 0 })
  value: number;

  @Column({ type: 'bigint', default: 1 })
  count: number;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}