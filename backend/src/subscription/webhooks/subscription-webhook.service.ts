import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { SubscriptionService } from '../subscription.service';
import { EmailService } from '../../shared/services/email.service';
import { User } from '../../auth/entities/user.entity';

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
    previous_attributes?: any;
  };
  created: number;
}

interface IyzicoWebhookEvent {
  eventType: string;
  eventTime: string;
  conversationId: string;
  data: any;
}

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: any;
  create_time: string;
}

@Injectable()
export class SubscriptionWebhookService {
  private readonly logger = new Logger(SubscriptionWebhookService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly subscriptionService: SubscriptionService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verify Stripe webhook signature
   */
  async verifyStripeSignature(payload: string, signature: string): Promise<boolean> {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
      
      if (!webhookSecret) {
        this.logger.warn('Stripe webhook secret not configured');
        return false;
      }

      const elements = signature.split(',');
      const signatureElements = elements.reduce((acc, element) => {
        const [key, value] = element.split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      const timestamp = signatureElements.t;
      const expectedSignature = signatureElements.v1;

      if (!timestamp || !expectedSignature) {
        return false;
      }

      // Create signature
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      );
    } catch (error) {
      this.logger.error(`Error verifying Stripe signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify Iyzico webhook signature
   */
  async verifyIyzicoSignature(payload: any, signature: string): Promise<boolean> {
    try {
      const webhookSecret = this.configService.get<string>('IYZICO_WEBHOOK_SECRET');
      
      if (!webhookSecret) {
        this.logger.warn('Iyzico webhook secret not configured');
        return false;
      }

      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      );
    } catch (error) {
      this.logger.error(`Error verifying Iyzico signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify PayPal webhook signature
   */
  async verifyPayPalSignature(
    headers: {
      transmissionId: string;
      certId: string;
      signature: string;
      transmissionTime: string;
    },
    payload: any,
  ): Promise<boolean> {
    try {
      // PayPal webhook verification is more complex and would require
      // additional PayPal SDK integration. For now, we'll do basic validation
      const webhookId = this.configService.get<string>('PAYPAL_WEBHOOK_ID');
      
      if (!webhookId) {
        this.logger.warn('PayPal webhook ID not configured');
        return false;
      }

      // Basic validation - in production, use PayPal SDK for proper verification
      return !!(headers.transmissionId && headers.signature && payload);
    } catch (error) {
      this.logger.error(`Error verifying PayPal signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeEvent(event: StripeWebhookEvent): Promise<void> {
    this.logger.log(`Processing Stripe event: ${event.type}`);

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object, 'stripe');
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object, 'stripe');
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object, 'stripe');
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object, 'stripe');
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object, 'stripe');
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object, 'stripe');
          break;

        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing Stripe event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle Iyzico webhook events
   */
  async handleIyzicoEvent(event: IyzicoWebhookEvent): Promise<void> {
    this.logger.log(`Processing Iyzico event: ${event.eventType}`);

    try {
      switch (event.eventType) {
        case 'SUBSCRIPTION_CREATED':
          await this.handleSubscriptionCreated(event.data, 'iyzico');
          break;

        case 'SUBSCRIPTION_UPDATED':
          await this.handleSubscriptionUpdated(event.data, 'iyzico');
          break;

        case 'SUBSCRIPTION_CANCELED':
          await this.handleSubscriptionCanceled(event.data, 'iyzico');
          break;

        case 'PAYMENT_SUCCESS':
          await this.handlePaymentSucceeded(event.data, 'iyzico');
          break;

        case 'PAYMENT_FAILED':
          await this.handlePaymentFailed(event.data, 'iyzico');
          break;

        default:
          this.logger.log(`Unhandled Iyzico event type: ${event.eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error processing Iyzico event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle PayPal webhook events
   */
  async handlePayPalEvent(event: PayPalWebhookEvent): Promise<void> {
    this.logger.log(`Processing PayPal event: ${event.event_type}`);

    try {
      switch (event.event_type) {
        case 'BILLING.SUBSCRIPTION.CREATED':
          await this.handleSubscriptionCreated(event.resource, 'paypal');
          break;

        case 'BILLING.SUBSCRIPTION.UPDATED':
          await this.handleSubscriptionUpdated(event.resource, 'paypal');
          break;

        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await this.handleSubscriptionCanceled(event.resource, 'paypal');
          break;

        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePaymentSucceeded(event.resource, 'paypal');
          break;

        case 'PAYMENT.SALE.DENIED':
          await this.handlePaymentFailed(event.resource, 'paypal');
          break;

        default:
          this.logger.log(`Unhandled PayPal event type: ${event.event_type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing PayPal event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle test webhook events for development/testing
   */
  async handleTestEvent(event: any): Promise<void> {
    this.logger.log(`Processing test event: ${JSON.stringify(event)}`);
    
    if (event.type === 'test.subscription.payment_succeeded') {
      const subscription = await this.subscriptionRepository.findOne({
        where: { subscriptionId: event.subscription_id },
        relations: ['user', 'plan'],
      });

      if (subscription) {
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.lastPaymentDate = new Date();
        subscription.nextPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await this.subscriptionRepository.save(subscription);

        this.logger.log(`Test: Subscription ${subscription.id} activated`);
      }
    }
  }

  /**
   * Handle subscription created event
   */
  private async handleSubscriptionCreated(data: any, provider: string): Promise<void> {
    this.logger.log(`Subscription created via ${provider}: ${JSON.stringify(data)}`);

    // Find subscription by external ID
    const subscription = await this.subscriptionRepository.findOne({
      where: { subscriptionId: this.getExternalSubscriptionId(data, provider) },
      relations: ['user', 'plan'],
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.paymentDetails = data;
      await this.subscriptionRepository.save(subscription);

      this.logger.log(`Subscription ${subscription.id} activated via webhook`);
    }
  }

  /**
   * Handle subscription updated event
   */
  private async handleSubscriptionUpdated(data: any, provider: string): Promise<void> {
    this.logger.log(`Subscription updated via ${provider}: ${JSON.stringify(data)}`);

    const subscription = await this.subscriptionRepository.findOne({
      where: { subscriptionId: this.getExternalSubscriptionId(data, provider) },
      relations: ['user', 'plan'],
    });

    if (subscription) {
      // Update subscription based on the new data
      if (data.status) {
        subscription.status = this.mapExternalStatus(data.status, provider);
      }
      
      subscription.paymentDetails = data;
      await this.subscriptionRepository.save(subscription);

      this.logger.log(`Subscription ${subscription.id} updated via webhook`);
    }
  }

  /**
   * Handle subscription canceled event
   */
  private async handleSubscriptionCanceled(data: any, provider: string): Promise<void> {
    this.logger.log(`Subscription canceled via ${provider}: ${JSON.stringify(data)}`);

    const subscription = await this.subscriptionRepository.findOne({
      where: { subscriptionId: this.getExternalSubscriptionId(data, provider) },
      relations: ['user', 'plan'],
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
      subscription.autoRenew = false;
      subscription.paymentDetails = data;
      await this.subscriptionRepository.save(subscription);

      // Send cancellation email
      if (subscription.user?.email) {
        try {
          await this.emailService.sendSubscriptionCanceledEmail(
            subscription.user.email,
            subscription.plan?.name || 'Subscription',
            subscription.endDate || new Date(),
          );
        } catch (emailError) {
          this.logger.error(`Failed to send cancellation email: ${emailError.message}`);
        }
      }

      this.logger.log(`Subscription ${subscription.id} canceled via webhook`);
    }
  }

  /**
   * Handle payment succeeded event
   */
  private async handlePaymentSucceeded(data: any, provider: string): Promise<void> {
    this.logger.log(`Payment succeeded via ${provider}: ${JSON.stringify(data)}`);

    const subscriptionId = this.getSubscriptionIdFromPayment(data, provider);
    
    if (subscriptionId) {
      const subscription = await this.subscriptionRepository.findOne({
        where: { subscriptionId },
        relations: ['user', 'plan'],
      });

      if (subscription) {
        // Update subscription with successful payment
        subscription.status = SubscriptionStatus.ACTIVE;
        subscription.lastPaymentDate = new Date();
        
        // Calculate next payment date based on plan duration
        if (subscription.plan) {
          const nextPaymentDate = new Date();
          nextPaymentDate.setDate(nextPaymentDate.getDate() + subscription.plan.duration);
          subscription.nextPaymentDate = nextPaymentDate;
        }

        subscription.paymentDetails = data;
        await this.subscriptionRepository.save(subscription);

        // Send payment confirmation email
        if (subscription.user?.email) {
          try {
            await this.emailService.sendPaymentSuccessEmail(
              subscription.user.email,
              subscription.plan?.name || 'Subscription',
              subscription.amount || 0,
              subscription.currency || 'USD',
            );
          } catch (emailError) {
            this.logger.error(`Failed to send payment success email: ${emailError.message}`);
          }
        }

        this.logger.log(`Payment processed for subscription ${subscription.id}`);
      }
    }
  }

  /**
   * Handle payment failed event
   */
  private async handlePaymentFailed(data: any, provider: string): Promise<void> {
    this.logger.log(`Payment failed via ${provider}: ${JSON.stringify(data)}`);

    const subscriptionId = this.getSubscriptionIdFromPayment(data, provider);
    
    if (subscriptionId) {
      const subscription = await this.subscriptionRepository.findOne({
        where: { subscriptionId },
        relations: ['user', 'plan'],
      });

      if (subscription) {
        // Update subscription status
        subscription.status = SubscriptionStatus.FAILED;
        subscription.paymentDetails = data;
        await this.subscriptionRepository.save(subscription);

        // Send payment failed email
        if (subscription.user?.email) {
          try {
            await this.emailService.sendPaymentFailedEmail(
              subscription.user.email,
              subscription.plan?.name || 'Subscription',
              subscription.amount || 0,
              subscription.currency || 'USD',
            );
          } catch (emailError) {
            this.logger.error(`Failed to send payment failed email: ${emailError.message}`);
          }
        }

        this.logger.log(`Payment failed for subscription ${subscription.id}`);
      }
    }
  }

  /**
   * Handle trial will end event
   */
  private async handleTrialWillEnd(data: any, provider: string): Promise<void> {
    this.logger.log(`Trial will end via ${provider}: ${JSON.stringify(data)}`);

    const subscription = await this.subscriptionRepository.findOne({
      where: { subscriptionId: this.getExternalSubscriptionId(data, provider) },
      relations: ['user', 'plan'],
    });

    if (subscription && subscription.user?.email) {
      try {
        const daysLeft = Math.ceil(
          (subscription.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        await this.emailService.sendTrialEndingSoonEmail(
          subscription.user.email,
          daysLeft,
          subscription.endDate,
          subscription.plan?.name || 'Subscription',
        );
      } catch (emailError) {
        this.logger.error(`Failed to send trial ending email: ${emailError.message}`);
      }
    }
  }

  /**
   * Get external subscription ID based on provider
   */
  private getExternalSubscriptionId(data: any, provider: string): string {
    switch (provider) {
      case 'stripe':
        return data.id;
      case 'iyzico':
        return data.subscriptionReferenceCode || data.subscriptionId;
      case 'paypal':
        return data.id;
      default:
        return data.id || data.subscriptionId;
    }
  }

  /**
   * Get subscription ID from payment data
   */
  private getSubscriptionIdFromPayment(data: any, provider: string): string | null {
    switch (provider) {
      case 'stripe':
        return data.subscription;
      case 'iyzico':
        return data.subscriptionReferenceCode || data.subscriptionId;
      case 'paypal':
        return data.billing_agreement_id;
      default:
        return data.subscription || data.subscriptionId;
    }
  }

  /**
   * Map external status to internal status
   */
  private mapExternalStatus(externalStatus: string, provider: string): SubscriptionStatus {
    const statusMap: Record<string, Record<string, SubscriptionStatus>> = {
      stripe: {
        active: SubscriptionStatus.ACTIVE,
        canceled: SubscriptionStatus.CANCELED,
        incomplete: SubscriptionStatus.PENDING,
        incomplete_expired: SubscriptionStatus.EXPIRED,
        past_due: SubscriptionStatus.FAILED,
        trialing: SubscriptionStatus.TRIAL,
        unpaid: SubscriptionStatus.FAILED,
      },
      iyzico: {
        ACTIVE: SubscriptionStatus.ACTIVE,
        CANCELED: SubscriptionStatus.CANCELED,
        EXPIRED: SubscriptionStatus.EXPIRED,
        FAILED: SubscriptionStatus.FAILED,
      },
      paypal: {
        ACTIVE: SubscriptionStatus.ACTIVE,
        CANCELLED: SubscriptionStatus.CANCELED,
        EXPIRED: SubscriptionStatus.EXPIRED,
        SUSPENDED: SubscriptionStatus.FAILED,
      },
    };

    return statusMap[provider]?.[externalStatus] || SubscriptionStatus.PENDING;
  }
}