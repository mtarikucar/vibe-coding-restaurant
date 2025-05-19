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
import { ReportType, TemplateCategory } from "./report.enums";

@Entity()
export class ReportTemplate {
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
    enum: TemplateCategory,
    default: TemplateCategory.CUSTOM,
  })
  category: TemplateCategory;

  @Column({ type: "jsonb" })
  structure: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  defaultParameters: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  visualizationOptions: Record<string, any>;

  @Column({ default: false })
  isSystem: boolean;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy: User;

  @Column()
  createdById: string;

  @OneToMany(() => Report, (report) => report.template)
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
