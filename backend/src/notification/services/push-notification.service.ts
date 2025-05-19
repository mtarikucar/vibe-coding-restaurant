import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushSubscription } from '../entities/push-subscription.entity';
import { Notification } from '../entities/notification.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private vapidDetails: { publicKey: string; privateKey: string };
  private readonly vapidSubject: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
  ) {
    this.vapidSubject = `mailto:${this.configService.get<string>('EMAIL_FROM')}`;
  }

  async onModuleInit() {
    await this.initializeVapidKeys();
  }

  private async initializeVapidKeys() {
    try {
      // Check if VAPID keys exist in environment variables
      const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
      const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');

      if (publicKey && privateKey) {
        this.vapidDetails = { publicKey, privateKey };
        this.logger.log('Using VAPID keys from environment variables');
      } else {
        // Check if keys exist in a file
        const keysPath = path.join(process.cwd(), 'vapid-keys.json');
        
        if (fs.existsSync(keysPath)) {
          const keysData = fs.readFileSync(keysPath, 'utf8');
          this.vapidDetails = JSON.parse(keysData);
          this.logger.log('Using VAPID keys from file');
        } else {
          // Generate new keys
          this.vapidDetails = webpush.generateVAPIDKeys();
          
          // Save keys to file for future use
          fs.writeFileSync(keysPath, JSON.stringify(this.vapidDetails), 'utf8');
          this.logger.log('Generated new VAPID keys and saved to file');
        }
      }

      // Set VAPID details
      webpush.setVapidDetails(
        this.vapidSubject,
        this.vapidDetails.publicKey,
        this.vapidDetails.privateKey,
      );
    } catch (error) {
      this.logger.error(`Error initializing VAPID keys: ${error.message}`, error.stack);
      throw error;
    }
  }

  getPublicKey(): string {
    return this.vapidDetails.publicKey;
  }

  async saveSubscription(userId: string, tenantId: string, subscriptionData: string): Promise<PushSubscription> {
    try {
      // Parse the subscription data
      const parsedData = JSON.parse(subscriptionData);
      
      // Check if subscription already exists
      const existingSubscription = await this.pushSubscriptionRepository.findOne({
        where: {
          endpoint: parsedData.endpoint,
          userId,
        },
      });

      if (existingSubscription) {
        this.logger.log(`Subscription already exists for user ${userId}`);
        return existingSubscription;
      }

      // Create new subscription
      const subscription = this.pushSubscriptionRepository.create({
        userId,
        tenantId,
        endpoint: parsedData.endpoint,
        p256dh: parsedData.keys.p256dh,
        auth: parsedData.keys.auth,
        expirationTime: parsedData.expirationTime,
      });

      return await this.pushSubscriptionRepository.save(subscription);
    } catch (error) {
      this.logger.error(`Error saving push subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteSubscription(userId: string, subscriptionData: string): Promise<boolean> {
    try {
      const parsedData = JSON.parse(subscriptionData);
      
      const result = await this.pushSubscriptionRepository.delete({
        userId,
        endpoint: parsedData.endpoint,
      });

      return result.affected > 0;
    } catch (error) {
      this.logger.error(`Error deleting push subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendNotification(notification: Notification): Promise<void> {
    try {
      // Get all subscriptions for the user
      const subscriptions = await this.pushSubscriptionRepository.find({
        where: { userId: notification.recipientId },
      });

      if (!subscriptions.length) {
        this.logger.log(`No push subscriptions found for user ${notification.recipientId}`);
        return;
      }

      // Prepare notification payload
      const payload = JSON.stringify({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        type: notification.type,
        priority: notification.priority,
        timestamp: notification.createdAt.getTime(),
      });

      // Send notification to all subscriptions
      const sendPromises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
              expirationTime: subscription.expirationTime,
            },
            payload,
          );
        } catch (error) {
          // If subscription is expired or invalid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            this.logger.warn(`Removing invalid subscription for user ${subscription.userId}`);
            await this.pushSubscriptionRepository.delete(subscription.id);
          } else {
            this.logger.error(`Error sending push notification: ${error.message}`, error.stack);
          }
        }
      });

      await Promise.all(sendPromises);
    } catch (error) {
      this.logger.error(`Error in sendNotification: ${error.message}`, error.stack);
    }
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const count = await this.pushSubscriptionRepository.count({
        where: { userId },
      });
      return count > 0;
    } catch (error) {
      this.logger.error(`Error checking subscription status: ${error.message}`, error.stack);
      return false;
    }
  }
}
