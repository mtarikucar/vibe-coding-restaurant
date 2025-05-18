import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDate,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus 
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  readAt?: Date;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  archivedAt?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsUUID()
  recipientId: string;

  @IsUUID()
  @IsOptional()
  senderId?: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
