import {
  Controller,
  Post,
  Body,
  Headers,
  HttpStatus,
  HttpException,
  Logger,
  Req,
  RawBody,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionWebhookService } from './subscription-webhook.service';
import { ConfigService } from '@nestjs/config';

@Controller('webhooks/subscription')
export class SubscriptionWebhookController {
  private readonly logger = new Logger(SubscriptionWebhookController.name);

  constructor(
    private readonly subscriptionWebhookService: SubscriptionWebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('stripe-signature') stripeSignature: string,
    @Req() req: Request,
  ) {
    this.logger.log('Received Stripe webhook');

    try {
      // Verify webhook signature
      const isValid = await this.subscriptionWebhookService.verifyStripeSignature(
        req['rawBody'] || JSON.stringify(body),
        stripeSignature,
      );

      if (!isValid) {
        this.logger.error('Invalid Stripe webhook signature');
        throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
      }

      // Process the webhook event
      await this.subscriptionWebhookService.handleStripeEvent(body);

      return { received: true };
    } catch (error) {
      this.logger.error(`Stripe webhook error: ${error.message}`, error.stack);
      throw new HttpException(
        'Webhook processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('iyzico')
  async handleIyzicoWebhook(
    @Body() body: any,
    @Headers('x-iyzico-signature') iyzicoSignature: string,
  ) {
    this.logger.log('Received Iyzico webhook');

    try {
      // Verify webhook signature
      const isValid = await this.subscriptionWebhookService.verifyIyzicoSignature(
        body,
        iyzicoSignature,
      );

      if (!isValid) {
        this.logger.error('Invalid Iyzico webhook signature');
        throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
      }

      // Process the webhook event
      await this.subscriptionWebhookService.handleIyzicoEvent(body);

      return { received: true };
    } catch (error) {
      this.logger.error(`Iyzico webhook error: ${error.message}`, error.stack);
      throw new HttpException(
        'Webhook processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('paypal')
  async handlePayPalWebhook(
    @Body() body: any,
    @Headers('paypal-transmission-id') transmissionId: string,
    @Headers('paypal-cert-id') certId: string,
    @Headers('paypal-transmission-sig') signature: string,
    @Headers('paypal-transmission-time') transmissionTime: string,
  ) {
    this.logger.log('Received PayPal webhook');

    try {
      // Verify webhook signature
      const isValid = await this.subscriptionWebhookService.verifyPayPalSignature(
        {
          transmissionId,
          certId,
          signature,
          transmissionTime,
        },
        body,
      );

      if (!isValid) {
        this.logger.error('Invalid PayPal webhook signature');
        throw new HttpException('Invalid signature', HttpStatus.BAD_REQUEST);
      }

      // Process the webhook event
      await this.subscriptionWebhookService.handlePayPalEvent(body);

      return { received: true };
    } catch (error) {
      this.logger.error(`PayPal webhook error: ${error.message}`, error.stack);
      throw new HttpException(
        'Webhook processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test')
  async handleTestWebhook(@Body() body: any) {
    this.logger.log('Received test webhook');
    
    try {
      await this.subscriptionWebhookService.handleTestEvent(body);
      return { received: true, message: 'Test webhook processed successfully' };
    } catch (error) {
      this.logger.error(`Test webhook error: ${error.message}`, error.stack);
      throw new HttpException(
        'Test webhook processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}