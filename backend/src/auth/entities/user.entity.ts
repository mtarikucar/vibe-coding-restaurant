import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Tenant } from "../../tenant/entities/tenant.entity";
import { RefreshToken } from "./refresh-token.entity";

export enum UserRole {
  SUPER_ADMIN = "super_admin", // System-wide admin
  ADMIN = "admin", // Restaurant admin
  MANAGER = "manager", // Restaurant manager
  WAITER = "waiter",
  KITCHEN = "kitchen",
  CASHIER = "cashier",
  INVENTORY = "inventory", // Inventory manager
  MARKETING = "marketing", // Marketing manager
}

export enum UserSubscriptionStatus {
  TRIAL = "trial",
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELED = "canceled",
}

export enum OAuthProvider {
  GOOGLE = "google",
  FACEBOOK = "facebook",
  APPLE = "apple",
  GITHUB = "github",
  LOCAL = "local",
}

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  email: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.WAITER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpires: Date;

  @Column({ nullable: true, default: "en" })
  preferredLanguage: string;

  // Subscription related fields
  @Column({
    type: "enum",
    enum: UserSubscriptionStatus,
    default: UserSubscriptionStatus.TRIAL,
  })
  subscriptionStatus: UserSubscriptionStatus;

  @Column({ nullable: true })
  trialStartDate: Date;

  @Column({ nullable: true })
  trialEndDate: Date;

  @Column({ nullable: true })
  subscriptionId: string;

  @Column({ default: false })
  hasCompletedOnboarding: boolean;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true, type: "jsonb" })
  billingDetails: Record<string, any>;

  // Tenant relationship
  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  @JoinColumn({ name: "tenantId" })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @Column({ default: false })
  isSuperAdmin: boolean;

  // OAuth related fields
  @Column({
    type: "enum",
    enum: OAuthProvider,
    default: OAuthProvider.LOCAL,
  })
  provider: OAuthProvider;

  @Column({ nullable: true })
  providerId: string;

  @Column({ nullable: true, type: "jsonb" })
  providerData: Record<string, any>;

  // Refresh tokens relationship
  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
