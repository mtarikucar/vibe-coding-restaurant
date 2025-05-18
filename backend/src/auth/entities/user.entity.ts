import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

export enum UserRole {
  ADMIN = "admin",
  WAITER = "waiter",
  KITCHEN = "kitchen",
  CASHIER = "cashier",
}

export enum UserSubscriptionStatus {
  TRIAL = "trial",
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELED = "canceled",
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
