import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionScheduler {
  private readonly logger = new Logger(SubscriptionScheduler.name);

  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Check for expired trials every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredTrials() {
    this.logger.log('Checking for expired trials...');
    await this.subscriptionService.checkExpiredTrials();
  }

  /**
   * Check for trials that will expire soon every day at 8 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleExpiringTrials() {
    this.logger.log('Checking for trials expiring soon...');
    await this.subscriptionService.checkExpiringTrials();
  }
}
