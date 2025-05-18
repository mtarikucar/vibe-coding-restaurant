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
import { NotificationType } from "./notification.entity";

export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  PUSH = "push",
  SMS = "sms",
}

@Entity()
export class NotificationPreference {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: NotificationType,
  })
  notificationType: NotificationType;

  @Column({
    type: "enum",
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({ default: true })
  enabled: boolean;

  // User relationship
  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

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
