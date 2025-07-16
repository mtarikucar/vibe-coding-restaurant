import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Subscription, SubscriptionStatus, PaymentProvider } from '../entities/subscription.entity';
import { User } from '../../auth/entities/user.entity';
import { PaymentGatewayService } from '../../payment/services/payment-gateway.service';
import { EmailService } from '../../shared/services/email.service';
import { addDays, subDays, isBefore, isAfter } from 'date-fns';

interface PaymentRetryAttempt {
  subscriptionId: string;
  attemptNumber: number;
  nextRetryDate: Date;
  lastError?: string;
}

interface SubscriptionRenewalRequest {
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  customerId?: string;
}

@Injectable()
export class SubscriptionPaymentService {
  private readonly logger = new Logger(SubscriptionPaymentService.name);
  private readonly maxRetryAttempts = 3;
  private readonly retryDelays = [1, 3, 7]; // Days between retry attempts
  private readonly gracePeriodDays = 3;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Process subscription renewals - runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processSubscriptionRenewals(): Promise<void> {
    this.logger.log('Starting subscription renewal process');

    try {
      // Find subscriptions that need renewal (due today or overdue)
      const today = new Date();
      const subscriptionsToRenew = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.ACTIVE,
          autoRenew: true,
          nextPaymentDate: LessThan(addDays(today, 1)), // Due today or overdue
        },
        relations: ['user', 'plan'],
      });

      this.logger.log(`Found ${subscriptionsToRenew.length} subscriptions to renew`);

      for (const subscription of subscriptionsToRenew) {
        try {
          await this.processSubscriptionRenewal(subscription);
        } catch (error) {
          this.logger.error(
            `Failed to process renewal for subscription ${subscription.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log('Subscription renewal process completed');
    } catch (error) {
      this.logger.error(`Error in subscription renewal process: ${error.message}`, error.stack);
    }
  }

  /**
   * Process failed payment retries - runs daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async processFailedPaymentRetries(): Promise<void> {
    this.logger.log('Starting failed payment retry process');

    try {
      // Find subscriptions with failed payments that haven't exceeded max retry attempts
      const failedSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: SubscriptionStatus.FAILED,
          autoRenew: true,
        },
        relations: ['user', 'plan'],
      });

      for (const subscription of failedSubscriptions) {
        try {
          await this.retryFailedPayment(subscription);
        } catch (error) {
          this.logger.error(
            `Failed to retry payment for subscription ${subscription.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log('Failed payment retry process completed');
    } catch (error) {
      this.logger.error(`Error in failed payment retry process: ${error.message}`, error.stack);
    }
  }

  /**
   * Process subscription expiration - runs daily at 4 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async processSubscriptionExpirations(): Promise<void> {
    this.logger.log('Starting subscription expiration process');

    try {
      const today = new Date();
      const gracePeriodEnd = subDays(today, this.gracePeriodDays);

      // Find subscriptions that have exceeded the grace period
      const expiredSubscriptions = await this.subscriptionRepository.find({
        where: {
          status: In([SubscriptionStatus.FAILED, SubscriptionStatus.ACTIVE]),
          nextPaymentDate: LessThan(gracePeriodEnd),
        },
        relations: ['user', 'plan'],
      });

      for (const subscription of expiredSubscriptions) {
        try {
          await this.expireSubscription(subscription);
        } catch (error) {
          this.logger.error(
            `Failed to expire subscription ${subscription.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log('Subscription expiration process completed');
    } catch (error) {
      this.logger.error(`Error in subscription expiration process: ${error.message}`, error.stack);
    }
  }

  /**
   * Send upcoming renewal notifications - runs daily at 10 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendUpcomingRenewalNotifications(): Promise<void> {
    this.logger.log('Starting upcoming renewal notifications');

    try {
      const today = new Date();
      const threeDaysFromNow = addDays(today, 3);
      const sevenDaysFromNow = addDays(today, 7);

      // Find subscriptions renewing in 3 days
      const subscriptionsRenewingIn3Days = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.user', 'user')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .where('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
        .andWhere('subscription.autoRenew = :autoRenew', { autoRenew: true })
        .andWhere('subscription.nextPaymentDate < :threeDaysLater', { threeDaysLater: addDays(threeDaysFromNow, 1) })
        .andWhere('subscription.nextPaymentDate > :today', { today })
        .getMany();

      // Find subscriptions renewing in 7 days
      const subscriptionsRenewingIn7Days = await this.subscriptionRepository
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.user', 'user')
        .leftJoinAndSelect('subscription.plan', 'plan')
        .where('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
        .andWhere('subscription.autoRenew = :autoRenew', { autoRenew: true })
        .andWhere('subscription.nextPaymentDate < :sevenDaysLater', { sevenDaysLater: addDays(sevenDaysFromNow, 1) })
        .andWhere('subscription.nextPaymentDate > :threeDaysLater', { threeDaysLater: threeDaysFromNow })
        .getMany();

      // Send 3-day notifications
      for (const subscription of subscriptionsRenewingIn3Days) {
        await this.sendRenewalNotification(subscription, 3);
      }

      // Send 7-day notifications
      for (const subscription of subscriptionsRenewingIn7Days) {
        await this.sendRenewalNotification(subscription, 7);
      }

      this.logger.log('Upcoming renewal notifications completed');
    } catch (error) {
      this.logger.error(`Error sending renewal notifications: ${error.message}`, error.stack);
    }
  }

  /**
   * Process a single subscription renewal
   */
  private async processSubscriptionRenewal(subscription: Subscription): Promise<void> {
    this.logger.log(`Processing renewal for subscription ${subscription.id}`);

    if (!subscription.plan) {
      throw new Error('Subscription plan not found');
    }

    const renewalRequest: SubscriptionRenewalRequest = {
      subscriptionId: subscription.subscriptionId || subscription.id,
      amount: subscription.amount || subscription.plan.price,
      currency: subscription.currency || 'usd',
    };

    // Add payment method info from subscription details
    if (subscription.paymentDetails?.payment_method_id) {
      renewalRequest.paymentMethodId = subscription.paymentDetails.payment_method_id;
    }
    
    if (subscription.paymentDetails?.customer_id) {
      renewalRequest.customerId = subscription.paymentDetails.customer_id;
    }

    try {
      let paymentResult;

      switch (subscription.paymentProvider) {
        case PaymentProvider.STRIPE:
          paymentResult = await this.processStripeRenewal(renewalRequest);
          break;
        case PaymentProvider.IYZICO:
          paymentResult = await this.processIyzicoRenewal(renewalRequest);
          break;
        default:
          throw new Error(`Unsupported payment provider: ${subscription.paymentProvider}`);
      }

      if (paymentResult.success) {
        await this.handleSuccessfulRenewal(subscription, paymentResult);
      } else {
        await this.handleFailedRenewal(subscription, paymentResult.error);
      }
    } catch (error) {
      await this.handleFailedRenewal(subscription, error.message);
      throw error;
    }
  }

  /**
   * Process Stripe subscription renewal
   */
  private async processStripeRenewal(request: SubscriptionRenewalRequest): Promise<any> {
    try {
      // Create a simplified payment request for renewal
      const paymentData = {
        amount: request.amount,
        currency: request.currency,
        paymentMethodId: request.paymentMethodId,
        customerId: request.customerId,
        metadata: {
          subscription_id: request.subscriptionId,
          type: 'subscription_renewal',
        },
      };

      // For now, return a mock successful response
      // In production, this would integrate with the actual Stripe API
      return {
        success: true,
        paymentId: `pi_${Date.now()}`,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process Iyzico subscription renewal
   */
  private async processIyzicoRenewal(request: SubscriptionRenewalRequest): Promise<any> {
    try {
      // Create a simplified payment request for renewal
      const paymentData = {
        amount: request.amount,
        currency: request.currency,
        paymentMethodId: request.paymentMethodId,
        conversationId: request.subscriptionId,
      };

      // For now, return a mock successful response
      // In production, this would integrate with the actual Iyzico API
      return {
        success: true,
        paymentId: `iyz_${Date.now()}`,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle successful renewal
   */
  private async handleSuccessfulRenewal(subscription: Subscription, paymentResult: any): Promise<void> {
    this.logger.log(`Successful renewal for subscription ${subscription.id}`);

    // Update subscription
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.lastPaymentDate = new Date();
    
    // Calculate next payment date
    if (subscription.plan) {
      subscription.nextPaymentDate = addDays(new Date(), subscription.plan.duration);
    }

    // Clear any retry attempts
    if (subscription.paymentDetails) {
      delete subscription.paymentDetails.retryAttempts;
      delete subscription.paymentDetails.nextRetryDate;
    }

    subscription.paymentDetails = {
      ...subscription.paymentDetails,
      lastPaymentResult: paymentResult,
    };

    await this.subscriptionRepository.save(subscription);

    // Send success email
    if (subscription.user?.email) {
      try {
        await this.emailService.sendSubscriptionRenewalSuccessEmail(
          subscription.user.email,
          subscription.plan?.name || 'Subscription',
          subscription.amount || 0,
          subscription.currency || 'USD',
          subscription.nextPaymentDate,
        );
      } catch (emailError) {
        this.logger.error(`Failed to send renewal success email: ${emailError.message}`);
      }
    }
  }

  /**
   * Handle failed renewal
   */
  private async handleFailedRenewal(subscription: Subscription, errorMessage: string): Promise<void> {
    this.logger.log(`Failed renewal for subscription ${subscription.id}: ${errorMessage}`);

    // Update subscription status
    subscription.status = SubscriptionStatus.FAILED;

    // Initialize or update retry attempts
    if (!subscription.paymentDetails) {
      subscription.paymentDetails = {};
    }

    const retryAttempts = subscription.paymentDetails.retryAttempts || 0;
    const newRetryAttempts = retryAttempts + 1;

    subscription.paymentDetails = {
      ...subscription.paymentDetails,
      retryAttempts: newRetryAttempts,
      lastError: errorMessage,
      lastFailedPaymentDate: new Date(),
    };

    // Set next retry date if we haven't exceeded max attempts
    if (newRetryAttempts <= this.maxRetryAttempts) {
      const delayDays = this.retryDelays[newRetryAttempts - 1] || 7;
      subscription.paymentDetails.nextRetryDate = addDays(new Date(), delayDays);
    }

    await this.subscriptionRepository.save(subscription);

    // Send failure email
    if (subscription.user?.email) {
      try {
        await this.emailService.sendSubscriptionRenewalFailedEmail(
          subscription.user.email,
          subscription.plan?.name || 'Subscription',
          errorMessage,
          newRetryAttempts,
          this.maxRetryAttempts,
        );
      } catch (emailError) {
        this.logger.error(`Failed to send renewal failed email: ${emailError.message}`);
      }
    }
  }

  /**
   * Retry failed payment
   */
  private async retryFailedPayment(subscription: Subscription): Promise<void> {
    const retryAttempts = subscription.paymentDetails?.retryAttempts || 0;
    const nextRetryDate = subscription.paymentDetails?.nextRetryDate;

    // Check if we should retry
    if (retryAttempts >= this.maxRetryAttempts) {
      this.logger.log(`Max retry attempts reached for subscription ${subscription.id}`);
      return;
    }

    if (nextRetryDate && isAfter(nextRetryDate, new Date())) {
      this.logger.log(`Not yet time to retry subscription ${subscription.id}`);
      return;
    }

    this.logger.log(`Retrying payment for subscription ${subscription.id}, attempt ${retryAttempts + 1}`);

    try {
      await this.processSubscriptionRenewal(subscription);
    } catch (error) {
      this.logger.error(`Retry failed for subscription ${subscription.id}: ${error.message}`);
    }
  }

  /**
   * Expire subscription after grace period
   */
  private async expireSubscription(subscription: Subscription): Promise<void> {
    this.logger.log(`Expiring subscription ${subscription.id}`);

    subscription.status = SubscriptionStatus.EXPIRED;
    subscription.autoRenew = false;
    subscription.canceledAt = new Date();

    await this.subscriptionRepository.save(subscription);

    // Send expiration email
    if (subscription.user?.email) {
      try {
        await this.emailService.sendSubscriptionExpiredEmail(
          subscription.user.email,
          subscription.plan?.name || 'Subscription',
        );
      } catch (emailError) {
        this.logger.error(`Failed to send expiration email: ${emailError.message}`);
      }
    }

    this.logger.log(`Subscription ${subscription.id} expired`);
  }

  /**
   * Send renewal notification
   */
  private async sendRenewalNotification(subscription: Subscription, daysUntilRenewal: number): Promise<void> {
    if (!subscription.user?.email) {
      return;
    }

    try {
      await this.emailService.sendUpcomingRenewalNotificationEmail(
        subscription.user.email,
        subscription.plan?.name || 'Subscription',
        daysUntilRenewal,
        subscription.nextPaymentDate,
        subscription.amount || 0,
        subscription.currency || 'USD',
      );

      this.logger.log(`Sent ${daysUntilRenewal}-day renewal notification for subscription ${subscription.id}`);
    } catch (error) {
      this.logger.error(`Failed to send renewal notification: ${error.message}`);
    }
  }

  /**
   * Manually trigger subscription renewal (for testing or admin use)
   */
  async triggerRenewal(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['user', 'plan'],
    });

    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    await this.processSubscriptionRenewal(subscription);
  }

  /**
   * Get subscription payment health status
   */
  async getSubscriptionPaymentHealth(): Promise<any> {
    const [active, failed, expired, retrying] = await Promise.all([
      this.subscriptionRepository.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.subscriptionRepository.count({ where: { status: SubscriptionStatus.FAILED } }),
      this.subscriptionRepository.count({ where: { status: SubscriptionStatus.EXPIRED } }),
      this.subscriptionRepository.count({
        where: {
          status: SubscriptionStatus.FAILED,
          // Has retry attempts
        },
      }),
    ]);

    return {
      active,
      failed,
      expired,
      retrying,
      healthScore: active / (active + failed + expired) * 100,
    };
  }
}