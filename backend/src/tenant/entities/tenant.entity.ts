import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";

export enum TenantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  TRIAL = "trial",
}

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  schema: string;

  @Column({ unique: true, nullable: true })
  subdomain: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  currency: string;

  @Column({
    type: "enum",
    enum: TenantStatus,
    default: TenantStatus.TRIAL,
  })
  status: TenantStatus;

  @Column({ nullable: true })
  trialStartDate: Date;

  @Column({ nullable: true })
  trialEndDate: Date;

  @Column({ nullable: true })
  subscriptionId: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true, type: "jsonb" })
  settings: Record<string, any>;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
