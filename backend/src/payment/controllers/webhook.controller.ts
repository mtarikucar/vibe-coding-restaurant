import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { StripeService } from '../services/stripe.service';
import { IyzicoService } from '../services/iyzico.service';
import { PayPalService } from '../services/paypal.service';
import { PaymentService } from '../payment.service';
import { PaymentStatus } from '../entities/payment.entity';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeService: StripeService,
    private readonly iyzicoService: IyzicoService,
    private readonly paypalService: PayPalService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new HttpException('Missing stripe-signature header', HttpStatus.BAD_REQUEST);
    }

    try {
      const event = await this.stripeService.constructWebhookEvent(
        req.rawBody,
        signature,
      );

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handleStripePaymentFailed(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleStripeRefund(event.data.object);
          break;
        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error handling Stripe webhook: ${error.message}`, error.stack);
      throw new HttpException(
        `Webhook Error: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('paypal')
  async handlePayPalWebhook(
    @Headers('paypal-auth-algo') authAlgo: string,
    @Headers('paypal-cert-url') certUrl: string,
    @Headers('paypal-transmission-id') transmissionId: string,
    @Headers('paypal-transmission-sig') transmissionSig: string,
    @Headers('paypal-transmission-time') transmissionTime: string,
    @Body() payload: any,
  ) {
    try {
      // In a real implementation, you would verify the webhook signature
      // For now, we'll just process the event

      // Handle the event
      switch (payload.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePayPalPaymentCompleted(payload.resource);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePayPalPaymentDenied(payload.resource);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handlePayPalRefund(payload.resource);
          break;
        default:
          this.logger.log(`Unhandled PayPal event type: ${payload.event_type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error handling PayPal webhook: ${error.message}`, error.stack);
      throw new HttpException(
        `Webhook Error: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('iyzico')
  async handleIyzicoWebhook(@Body() payload: any) {
    try {
      // In a real implementation, you would verify the webhook signature
      // For now, we'll just process the event

      // Handle the event
      switch (payload.type) {
        case 'payment.success':
          await this.handleIyzicoPaymentSuccess(payload.data);
          break;
        case 'payment.failure':
          await this.handleIyzicoPaymentFailure(payload.data);
          break;
        case 'payment.refund':
          await this.handleIyzicoRefund(payload.data);
          break;
        default:
          this.logger.log(`Unhandled iyzico event type: ${payload.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error handling iyzico webhook: ${error.message}`, error.stack);
      throw new HttpException(
        `Webhook Error: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Stripe event handlers
  private async handleStripePaymentSucceeded(paymentIntent: any) {
    try {
      // Find the payment by transaction ID
      const payment = await this.paymentService.findByTransactionId(paymentIntent.id);
      
      if (payment) {
        // Update payment status
        await this.paymentService.updateStatus(payment.id, PaymentStatus.COMPLETED);
        this.logger.log(`Updated payment ${payment.id} status to COMPLETED`);
      } else {
        this.logger.warn(`Payment not found for Stripe payment intent: ${paymentIntent.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling Stripe payment succeeded: ${error.message}`, error.stack);
    }
  }

  private async handleStripePaymentFailed(paymentIntent: any) {
    try {
      // Find the payment by transaction ID
      const payment = await this.paymentService.findByTransactionId(paymentIntent.id);
      
      if (payment) {
        // Update payment status
        await this.paymentService.updateStatus(payment.id, PaymentStatus.FAILED);
        this.logger.log(`Updated payment ${payment.id} status to FAILED`);
      } else {
        this.logger.warn(`Payment not found for Stripe payment intent: ${paymentIntent.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling Stripe payment failed: ${error.message}`, error.stack);
    }
  }

  private async handleStripeRefund(charge: any) {
    try {
      // Find the payment by transaction ID
      const payment = await this.paymentService.findByTransactionId(charge.payment_intent);
      
      if (payment) {
        // Update payment status
        await this.paymentService.updateStatus(payment.id, PaymentStatus.REFUNDED);
        this.logger.log(`Updated payment ${payment.id} status to REFUNDED`);
      } else {
        this.logger.warn(`Payment not found for Stripe charge: ${charge.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling Stripe refund: ${error.message}`, error.stack);
    }
  }

  // PayPal event handlers
  private async handlePayPalPaymentCompleted(resource: any) {
    try {
      // Find the payment by transaction ID
      const payment = await this.paymentService.findByTransactionId(resource.id);
      
      if (payment) {
        // Update payment status
        await this.paymentService.updateStatus(payment.id, PaymentStatus.COMPLETED);
        this.logger.log(`Updated payment ${payment.id} status to COMPLETED`);
      } else {
        this.logger.warn(`Payment not found for PayPal payment: ${resource.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling PayPal payment completed: ${error.message}`, error.stack);
    }
  }

  private async handlePayPalPaymentDenied(resource: any) {
    try {
      // Find the payment by transaction ID
      const payment = await this.paymentService.findByTransactionId(resource.id);
      
      if (payment) {
        // Update payment status
        await this.paymentService.updateStatus(payment.id, PaymentStatus.FAILED);
        this.logger.log(`Updated payment ${payment.id} status to FAILED`);
      } else {
        this.logger.warn(`Payment not found for PayPal payment: ${resource.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling PayPal payment denied: ${error.message}`, error.stack);
    }
  }

  private async handlePayPalRefund(resource: any) {
    try {
      // Find the payment by transaction ID
      const payment = await this.paymentService.findByTransactionId(resource.id);
      
      if (payment) {
        // Update payment status
        await this.paymentService.updateStatus(payment.id, PaymentStatus.REFUNDED);
        this.logger.log(`Updated payment ${payment.id} status to REFUNDED`);
      } else {
        this.logger.warn(`Payment not found for PayPal refund: ${resource.id}`);
      }
    } catch (error) {
      this.logger.error(`Error handling PayPal refund: ${error.message}`, error.stack);
    }
  }

  // iyzico event handlers
  private async handleIyzicoPaymentSuccess(data: any) {
    try {
      // Find the payment by transaction ID
      const payment = await this.paymentService.findByTransactionId(data.paymentId);
      
      if (payment) {
        // Update payment status
        await this.paymentService.updateStatus(payment.id, PaymentStatus.COMPLETED);
        this.logger.log(`Updated payment ${payment.id} status to COMPLETED`);
      } else {
        this.logger.warn(`Payment not found for iyzico payment: ${data.paymentId}`);
      }
    } catch (error) {
      this.logger.error(`Error handling iyzico payment success: ${error.message}`, error.stack);
    }
  }

  private async handleIyzicoPaymentFailure(data: any) {
    try {
      // Find the payment by transaction ID
      const payment = await this.paymentService.findByTransactionId(data.paymentId);
      
      if (payment) {
        // Update payment status
        await this.paymentService.updateStatus(payment.id, PaymentStatus.FAILED);
        this.logger.log(`Updated payment ${payment.id} status to FAILED`);
      } else {
        this.logger.warn(`Payment not found for iyzico payment: ${data.paymentId}`);
      }
    } catch (error) {
      this.logger.error(`Error handling iyzico payment failure: ${error.message}`, error.stack);
    }
  }

  private async handleIyzicoRefund(data: any) {
    try {
      // Find the payment by transaction ID
      const payment = await this.paymentService.findByTransactionId(data.paymentId);
      
      if (payment) {
        // Update payment status
        await this.paymentService.updateStatus(payment.id, PaymentStatus.REFUNDED);
        this.logger.log(`Updated payment ${payment.id} status to REFUNDED`);
      } else {
        this.logger.warn(`Payment not found for iyzico refund: ${data.paymentId}`);
      }
    } catch (error) {
      this.logger.error(`Error handling iyzico refund: ${error.message}`, error.stack);
    }
  }
}
