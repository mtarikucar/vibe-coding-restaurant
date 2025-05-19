import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";
import { ReportTemplate } from "./report-template.entity";
import { ReportSchedule } from "./report-schedule.entity";
import { ReportStatus, ReportFormat, ReportType } from "./report.enums";

@Entity()
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: ReportType,
    default: ReportType.SALES,
  })
  type: ReportType;

  @Column({
    type: "enum",
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  status: ReportStatus;

  @Column({ type: "jsonb", nullable: true })
  filters: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  parameters: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  data: Record<string, any>;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  generatedAt: Date;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({
    type: "enum",
    enum: ReportFormat,
    default: ReportFormat.PDF,
  })
  format: ReportFormat;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: false })
  isFavorite: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy: User;

  @Column()
  createdById: string;

  @ManyToOne(() => ReportTemplate, { nullable: true })
  @JoinColumn({ name: "templateId" })
  template: ReportTemplate;

  @Column({ nullable: true })
  templateId: string;

  @ManyToOne(() => ReportSchedule, { nullable: true })
  @JoinColumn({ name: "scheduleId" })
  schedule: ReportSchedule;

  @Column({ nullable: true })
  scheduleId: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: "report_shares",
    joinColumn: { name: "reportId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "userId", referencedColumnName: "id" },
  })
  sharedWith: User[];

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
