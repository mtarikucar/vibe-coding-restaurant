import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";
import { Report } from "./report.entity";
import { ReportFormat } from "./report.enums";

export enum ScheduleFrequency {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
  CUSTOM = "custom",
}

export enum DeliveryMethod {
  EMAIL = "email",
  DOWNLOAD = "download",
  NOTIFICATION = "notification",
}

@Entity()
export class ReportSchedule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: ScheduleFrequency,
    default: ScheduleFrequency.WEEKLY,
  })
  frequency: ScheduleFrequency;

  @Column({ type: "jsonb", nullable: true })
  cronExpression: Record<string, any>;

  @Column({ nullable: true })
  nextRunDate: Date;

  @Column({ nullable: true })
  lastRunDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: "enum",
    enum: DeliveryMethod,
    default: DeliveryMethod.EMAIL,
  })
  deliveryMethod: DeliveryMethod;

  @Column({ type: "jsonb", nullable: true })
  deliveryConfig: Record<string, any>;

  @Column({
    type: "enum",
    enum: ReportFormat,
    default: ReportFormat.PDF,
  })
  format: ReportFormat;

  @Column({ type: "jsonb", nullable: true })
  recipients: string[];

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy: User;

  @Column()
  createdById: string;

  @OneToMany(() => Report, (report) => report.schedule)
  reports: Report[];

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenantId" })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
