import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";
import { Tenant } from "../../tenant/entities/tenant.entity";

export enum NotificationType {
  SYSTEM = "system",
  ORDER = "order",
  KITCHEN = "kitchen",
  PAYMENT = "payment",
  STOCK = "stock",
  USER = "user",
  CAMPAIGN = "campaign",
  SUBSCRIPTION = "subscription",
}

export enum NotificationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum NotificationStatus {
  UNREAD = "unread",
  READ = "read",
  ARCHIVED = "archived",
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: "text" })
  message: string;

  @Column({ nullable: true })
  link: string;

  @Column({
    type: "enum",
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    type: "enum",
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
  archivedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true, type: "jsonb" })
  metadata: Record<string, any>;

  // Recipient relationship
  @ManyToOne(() => User)
  @JoinColumn({ name: "recipientId" })
  recipient: User;

  @Column()
  recipientId: string;

  // Sender relationship (optional)
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "senderId" })
  sender: User;

  @Column({ nullable: true })
  senderId: string;

  // Tenant relationship
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: "tenantId" })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
