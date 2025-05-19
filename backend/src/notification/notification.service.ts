import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from "./entities/notification.entity";
import {
  NotificationPreference,
  NotificationChannel,
} from "./entities/notification-preference.entity";
import { EventsGateway } from "../events/events.gateway";
import { EmailService } from "../shared/services/email.service";
import { PushNotificationService } from "./services/push-notification.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationDto } from "./dto/update-notification.dto";
import { CreateNotificationPreferenceDto } from "./dto/create-notification-preference.dto";
import { UpdateNotificationPreferenceDto } from "./dto/update-notification-preference.dto";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly notificationPreferenceRepository: Repository<NotificationPreference>,
    private readonly eventsGateway: EventsGateway,
    private readonly emailService: EmailService,
    private pushNotificationService: PushNotificationService
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto
  ): Promise<Notification> {
    const notification = this.notificationRepository.create(
      createNotificationDto
    );
    const savedNotification =
      await this.notificationRepository.save(notification);

    // Send real-time notification via WebSocket
    this.eventsGateway.emitNotification(savedNotification);

    // Check if user has email notifications enabled for this type
    const emailPreference = await this.notificationPreferenceRepository.findOne(
      {
        where: {
          userId: createNotificationDto.recipientId,
          notificationType: createNotificationDto.type,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
      }
    );

    // Send email notification if enabled
    if (emailPreference) {
      try {
        // Get user email from the database
        // This would require injecting the UserService or similar
        const userEmail = "user@example.com"; // Replace with actual user email

        await this.emailService.sendEmail({
          to: userEmail,
          subject: notification.title,
          html: `<p>${notification.message}</p>`,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send email notification: ${error.message}`,
          error.stack
        );
      }
    }

    // Send push notification if enabled
    const pushPreference = await this.notificationPreferenceRepository.findOne({
      where: {
        userId: createNotificationDto.recipientId,
        notificationType: createNotificationDto.type,
        channel: NotificationChannel.PUSH,
        enabled: true,
      },
    });

    if (pushPreference) {
      try {
        await this.pushNotificationService.sendNotification(savedNotification);
      } catch (error) {
        this.logger.error(
          `Failed to send push notification: ${error.message}`,
          error.stack
        );
      }
    }

    return savedNotification;
  }

  async findAll(userId: string, tenantId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        recipientId: userId,
        tenantId,
        isArchived: false,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async findUnread(userId: string, tenantId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        recipientId: userId,
        tenantId,
        isRead: false,
        isArchived: false,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async findOne(
    id: string,
    userId: string,
    tenantId: string
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id,
        recipientId: userId,
        tenantId,
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async markAsRead(
    id: string,
    userId: string,
    tenantId: string
  ): Promise<Notification> {
    const notification = await this.findOne(id, userId, tenantId);

    notification.isRead = true;
    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    await this.notificationRepository.update(
      {
        recipientId: userId,
        tenantId,
        isRead: false,
      },
      {
        isRead: true,
        status: NotificationStatus.READ,
        readAt: new Date(),
      }
    );
  }

  async archive(
    id: string,
    userId: string,
    tenantId: string
  ): Promise<Notification> {
    const notification = await this.findOne(id, userId, tenantId);

    notification.isArchived = true;
    notification.status = NotificationStatus.ARCHIVED;
    notification.archivedAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    userId: string,
    tenantId: string
  ): Promise<Notification> {
    const notification = await this.findOne(id, userId, tenantId);

    Object.assign(notification, updateNotificationDto);

    return this.notificationRepository.save(notification);
  }

  async remove(id: string, userId: string, tenantId: string): Promise<void> {
    const notification = await this.findOne(id, userId, tenantId);
    await this.notificationRepository.remove(notification);
  }

  // Notification Preferences
  async getPreferences(
    userId: string,
    tenantId: string
  ): Promise<NotificationPreference[]> {
    try {
      this.logger.log(
        `Getting preferences for user ${userId} in tenant ${tenantId}`
      );

      const preferences = await this.notificationPreferenceRepository.find({
        where: {
          userId,
          tenantId,
        },
      });

      this.logger.log(
        `Found ${preferences.length} preferences for user ${userId}`
      );

      return preferences;
    } catch (error) {
      this.logger.error(
        `Failed to get preferences: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async createPreference(
    createPreferenceDto: CreateNotificationPreferenceDto
  ): Promise<NotificationPreference> {
    try {
      this.logger.log(
        `Creating preference: ${JSON.stringify(createPreferenceDto)}`
      );

      // Check if a similar preference already exists
      const existingPreference =
        await this.notificationPreferenceRepository.findOne({
          where: {
            userId: createPreferenceDto.userId,
            tenantId: createPreferenceDto.tenantId,
            notificationType: createPreferenceDto.notificationType,
            channel: createPreferenceDto.channel,
          },
        });

      if (existingPreference) {
        this.logger.log(
          `Preference already exists with ID ${existingPreference.id}. Updating instead.`
        );
        existingPreference.enabled =
          createPreferenceDto.enabled ?? existingPreference.enabled;
        return this.notificationPreferenceRepository.save(existingPreference);
      }

      // Create new preference
      const preference =
        this.notificationPreferenceRepository.create(createPreferenceDto);
      const savedPreference =
        await this.notificationPreferenceRepository.save(preference);

      this.logger.log(`Created preference with ID ${savedPreference.id}`);
      return savedPreference;
    } catch (error) {
      this.logger.error(
        `Failed to create preference: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  async updatePreference(
    id: string,
    updatePreferenceDto: UpdateNotificationPreferenceDto,
    userId: string,
    tenantId: string
  ): Promise<NotificationPreference> {
    const preference = await this.notificationPreferenceRepository.findOne({
      where: {
        id,
        userId,
        tenantId,
      },
    });

    if (!preference) {
      throw new NotFoundException(
        `Notification preference with ID ${id} not found`
      );
    }

    Object.assign(preference, updatePreferenceDto);

    return this.notificationPreferenceRepository.save(preference);
  }

  async createDefaultPreferences(
    userId: string,
    tenantId: string
  ): Promise<void> {
    try {
      this.logger.log(
        `Creating default preferences for user ${userId} in tenant ${tenantId}`
      );

      // Check if user already has preferences
      const existingPreferences =
        await this.notificationPreferenceRepository.find({
          where: { userId, tenantId },
        });

      if (existingPreferences.length > 0) {
        this.logger.log(
          `User ${userId} already has ${existingPreferences.length} preferences. Removing them first.`
        );
        // Remove existing preferences to avoid duplicates
        await this.notificationPreferenceRepository.remove(existingPreferences);
      }

      // Create default preferences for all notification types and channels
      const notificationTypes = Object.values(NotificationType);
      const channels = Object.values(NotificationChannel);

      this.logger.log(
        `Creating ${notificationTypes.length * channels.length} preferences for user ${userId}`
      );

      for (const type of notificationTypes) {
        for (const channel of channels) {
          // Default: enable in-app notifications for all types, email only for important ones
          const enabled =
            channel === NotificationChannel.IN_APP ||
            (channel === NotificationChannel.EMAIL &&
              [
                NotificationType.SYSTEM,
                NotificationType.PAYMENT,
                NotificationType.STOCK,
              ].includes(type as NotificationType));

          this.logger.log(
            `Creating preference: type=${type}, channel=${channel}, enabled=${enabled}`
          );

          const preference = this.notificationPreferenceRepository.create({
            userId,
            tenantId,
            notificationType: type as NotificationType,
            channel: channel as NotificationChannel,
            enabled,
          });

          await this.notificationPreferenceRepository.save(preference);
        }
      }

      this.logger.log(
        `Successfully created default preferences for user ${userId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to create default preferences: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
