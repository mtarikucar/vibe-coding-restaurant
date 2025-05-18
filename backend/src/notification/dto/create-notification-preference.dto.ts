import {
  IsEnum,
  IsBoolean,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { NotificationType } from '../entities/notification.entity';
import { NotificationChannel } from '../entities/notification-preference.entity';

export class CreateNotificationPreferenceDto {
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsUUID()
  userId: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;
}
