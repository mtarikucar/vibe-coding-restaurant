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

export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  PUSH = "push",
  SMS = "sms",
}

export interface NotificationPreference {
  id: string;
  notificationType: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
  userId: string;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}
