import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("STRIPE_SECRET_KEY");
    this.stripe = new Stripe(apiKey || "sk_test_dummy_key", {
      apiVersion: "2023-10-16",
    });
  }

  /**
   * Construct a webhook event from the raw body and signature
   */
  async constructWebhookEvent(
    rawBody: Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>(
      "STRIPE_WEBHOOK_SECRET"
    );

    if (!webhookSecret) {
      throw new Error("Stripe webhook secret is not configured");
    }

    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string = "usd",
    metadata: Record<string, any> = {}
  ): Promise<any> {
    try {
      // Convert amount to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency,
        metadata,
        payment_method_types: ["card"],
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error(
        `Stripe payment intent creation failed: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    try {
      // Check if customer exists, create if not
      let customer;
      try {
        customer = await this.stripe.customers.retrieve(customerId);
      } catch (error) {
        // Customer doesn't exist, create a new one
        if (metadata.email) {
          customer = await this.stripe.customers.create({
            email: metadata.email,
            name: metadata.name,
            metadata,
          });
          customerId = customer.id;
        } else {
          throw new Error("Email is required to create a customer");
        }
      }

      // Create the subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      // Handle the expanded invoice with payment_intent
      const invoice = subscription.latest_invoice;
      let clientSecret = "";

      if (
        typeof invoice !== "string" &&
        invoice.payment_intent &&
        typeof invoice.payment_intent !== "string"
      ) {
        clientSecret = invoice.payment_intent.client_secret || "";
      }

      return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret,
        customerId,
      };
    } catch (error) {
      this.logger.error(
        `Stripe subscription creation failed: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<any> {
    try {
      const subscription =
        await this.stripe.subscriptions.cancel(subscriptionId);

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
      };
    } catch (error) {
      this.logger.error(
        `Stripe subscription cancellation failed: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a product
   */
  async createProduct(
    name: string,
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    try {
      const product = await this.stripe.products.create({
        name,
        description,
        metadata,
      });

      return {
        success: true,
        productId: product.id,
      };
    } catch (error) {
      this.logger.error(
        `Stripe product creation failed: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a price
   */
  async createPrice(
    productId: string,
    amount: number,
    currency: string = "usd",
    interval: "month" | "year" = "month",
    metadata: Record<string, any> = {}
  ): Promise<any> {
    try {
      // Convert amount to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      const price = await this.stripe.prices.create({
        product: productId,
        unit_amount: amountInCents,
        currency,
        recurring: {
          interval,
        },
        metadata,
      });

      return {
        success: true,
        priceId: price.id,
      };
    } catch (error) {
      this.logger.error(
        `Stripe price creation failed: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify a payment
   */
  async verifyPayment(paymentIntentId: string): Promise<any> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error(
        `Stripe payment verification failed: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a checkout session
   */
  async createCheckoutSession(
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: Record<string, any> = {}
  ): Promise<any> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(
        `Stripe checkout session creation failed: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
