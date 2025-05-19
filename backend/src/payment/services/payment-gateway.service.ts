import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StripeService } from "./stripe.service";
import { IyzicoService } from "./iyzico.service";
import { PayPalService } from "./paypal.service";

export enum PaymentProvider {
  STRIPE = "stripe",
  IYZICO = "iyzico",
  PAYPAL = "paypal",
  MOCK = "mock", // For testing purposes
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  holderName?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethodId?: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface PaymentGatewayResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
  paymentUrl?: string;
  status?: string;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly provider: PaymentProvider;

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeService: StripeService,
    private readonly iyzicoService: IyzicoService,
    private readonly paypalService: PayPalService
  ) {
    // Get the payment provider from config, default to MOCK for development
    this.provider = this.configService.get<PaymentProvider>(
      "PAYMENT_PROVIDER",
      PaymentProvider.MOCK
    );
    this.logger.log(
      `Payment gateway initialized with provider: ${this.provider}`
    );
  }

  /**
   * Create a payment intent
   * @param amount Amount to charge in cents/smallest currency unit
   * @param currency Currency code (e.g., 'usd')
   * @param metadata Additional metadata for the payment
   */
  async createPaymentIntent(
    amount: number,
    currency: string = "usd",
    metadata: Record<string, any> = {}
  ): Promise<PaymentGatewayResponse> {
    try {
      // Get user country from metadata if available
      const userCountry = metadata?.userCountry || "unknown";

      // Use iyzico for Turkey, Stripe for other countries
      if (
        userCountry.toLowerCase() === "turkey" ||
        userCountry.toLowerCase() === "tr"
      ) {
        return this.createIyzicoPaymentIntent(amount, currency, metadata);
      }

      switch (this.provider) {
        case PaymentProvider.STRIPE:
          return this.createStripePaymentIntent(amount, currency, metadata);
        case PaymentProvider.IYZICO:
          return this.createIyzicoPaymentIntent(amount, currency, metadata);
        case PaymentProvider.PAYPAL:
          return this.createPayPalPaymentIntent(amount, currency, metadata);
        case PaymentProvider.MOCK:
        default:
          return this.createMockPaymentIntent(amount, currency, metadata);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create payment intent: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: `Payment processing error: ${error.message}`,
      };
    }
  }

  /**
   * Process a payment
   * @param paymentIntentId ID of the payment intent to process
   * @param paymentMethodId ID of the payment method to use
   */
  async processPayment(
    paymentIntentId: string,
    paymentMethodId: string,
    metadata: Record<string, any> = {}
  ): Promise<PaymentGatewayResponse> {
    try {
      // Get user country from metadata if available
      const userCountry = metadata?.userCountry || "unknown";

      // Use iyzico for Turkey, Stripe for other countries
      if (
        userCountry.toLowerCase() === "turkey" ||
        userCountry.toLowerCase() === "tr"
      ) {
        return this.processIyzicoPayment(paymentIntentId, paymentMethodId);
      }

      switch (this.provider) {
        case PaymentProvider.STRIPE:
          return this.processStripePayment(paymentIntentId, paymentMethodId);
        case PaymentProvider.IYZICO:
          return this.processIyzicoPayment(paymentIntentId, paymentMethodId);
        case PaymentProvider.PAYPAL:
          return this.processPayPalPayment(paymentIntentId, paymentMethodId);
        case PaymentProvider.MOCK:
        default:
          return this.processMockPayment(paymentIntentId, paymentMethodId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process payment: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: `Payment processing error: ${error.message}`,
      };
    }
  }

  /**
   * Verify a payment
   * @param transactionId ID of the transaction to verify
   */
  async verifyPayment(
    transactionId: string,
    metadata: Record<string, any> = {}
  ): Promise<PaymentGatewayResponse> {
    try {
      // Get user country from metadata if available
      const userCountry = metadata?.userCountry || "unknown";

      // Use iyzico for Turkey, Stripe for other countries
      if (
        userCountry.toLowerCase() === "turkey" ||
        userCountry.toLowerCase() === "tr"
      ) {
        return this.verifyIyzicoPayment(transactionId);
      }

      switch (this.provider) {
        case PaymentProvider.STRIPE:
          return this.verifyStripePayment(transactionId);
        case PaymentProvider.IYZICO:
          return this.verifyIyzicoPayment(transactionId);
        case PaymentProvider.PAYPAL:
          return this.verifyPayPalPayment(transactionId);
        case PaymentProvider.MOCK:
        default:
          return this.verifyMockPayment(transactionId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to verify payment: ${error.message}`,
        error.stack
      );
      return {
        success: false,
        error: `Payment verification error: ${error.message}`,
      };
    }
  }

  // Mock implementations for testing
  private async createMockPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentGatewayResponse> {
    const transactionId = `mock_intent_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.logger.log(
      `Created mock payment intent: ${transactionId} for ${amount} ${currency}`
    );

    return {
      success: true,
      transactionId,
      status: "created",
    };
  }

  private async processMockPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentGatewayResponse> {
    // Simulate a small delay for realism
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.logger.log(
      `Processed mock payment: ${paymentIntentId} with method ${paymentMethodId}`
    );

    // Simulate a success rate of 90%
    const isSuccess = Math.random() < 0.9;

    if (isSuccess) {
      return {
        success: true,
        transactionId: paymentIntentId,
        status: "succeeded",
      };
    } else {
      return {
        success: false,
        transactionId: paymentIntentId,
        error: "Mock payment failed (10% failure rate)",
        status: "failed",
      };
    }
  }

  private async verifyMockPayment(
    transactionId: string
  ): Promise<PaymentGatewayResponse> {
    // Simulate a small delay for realism
    await new Promise((resolve) => setTimeout(resolve, 300));

    this.logger.log(`Verified mock payment: ${transactionId}`);

    return {
      success: true,
      transactionId,
      status: "succeeded",
    };
  }

  // Stripe implementation using StripeService
  private async createStripePaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentGatewayResponse> {
    const result = await this.stripeService.createPaymentIntent(
      amount,
      currency,
      metadata
    );

    if (result.success) {
      return {
        success: true,
        transactionId: result.paymentIntentId,
        status: "created",
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  private async processStripePayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentGatewayResponse> {
    // In a real implementation, this would use the Stripe SDK to confirm the payment
    // For now, we'll just verify the payment
    return this.verifyStripePayment(paymentIntentId);
  }

  private async verifyStripePayment(
    transactionId: string
  ): Promise<PaymentGatewayResponse> {
    const result = await this.stripeService.verifyPayment(transactionId);

    if (result.success) {
      return {
        success: true,
        transactionId: result.paymentIntentId,
        status: result.status,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  // PayPal implementation using PayPalService
  private async createPayPalPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentGatewayResponse> {
    const result = await this.paypalService.createPayment(
      amount,
      currency,
      metadata
    );

    if (result.success) {
      return {
        success: true,
        transactionId: result.paymentId,
        status: result.status,
        paymentUrl: result.redirectUrl,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  private async processPayPalPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentGatewayResponse> {
    const result = await this.paypalService.capturePayment(paymentIntentId);

    if (result.success) {
      return {
        success: true,
        transactionId: result.paymentId,
        status: result.status,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  private async verifyPayPalPayment(
    transactionId: string
  ): Promise<PaymentGatewayResponse> {
    const result = await this.paypalService.verifyPayment(transactionId);

    if (result.success) {
      return {
        success: true,
        transactionId: result.paymentId,
        status: result.status,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  // iyzico implementation using IyzicoService
  private async createIyzicoPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentGatewayResponse> {
    // For Turkish payments, we would use TRY as currency
    const localCurrency = currency === "usd" ? "TRY" : currency;

    // Convert USD to TRY if needed (simplified conversion for example)
    const localAmount = currency === "usd" ? amount * 30 : amount; // Simple conversion rate

    const result = await this.iyzicoService.createPayment(
      localAmount,
      localCurrency,
      metadata
    );

    if (result.success) {
      return {
        success: true,
        transactionId: result.paymentId,
        status: "created",
        paymentUrl: result.redirectUrl,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }

  private async processIyzicoPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentGatewayResponse> {
    // In a real implementation, this would use the iyzico SDK to confirm the payment
    // For now, we'll just verify the payment
    return this.verifyIyzicoPayment(paymentIntentId);
  }

  private async verifyIyzicoPayment(
    transactionId: string
  ): Promise<PaymentGatewayResponse> {
    const result = await this.iyzicoService.verifyPayment(transactionId);

    if (result.success) {
      return {
        success: true,
        transactionId: result.paymentId,
        status: result.status,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  }
}
