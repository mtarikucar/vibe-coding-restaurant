import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Iyzipay from 'iyzipay';

@Injectable()
export class IyzicoService {
  private readonly logger = new Logger(IyzicoService.name);
  private readonly iyzipay: any;
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('IYZICO_API_KEY', 'sandbox-api-key');
    this.secretKey = this.configService.get<string>('IYZICO_SECRET_KEY', 'sandbox-secret-key');
    this.baseUrl = this.configService.get<string>('IYZICO_BASE_URL', 'https://sandbox-api.iyzipay.com');

    // Initialize Iyzipay SDK
    this.iyzipay = new Iyzipay({
      apiKey: this.apiKey,
      secretKey: this.secretKey,
      uri: this.baseUrl,
    });
  }

  /**
   * Create a payment request
   */
  async createPayment(
    amount: number,
    currency: string = 'TRY',
    metadata: Record<string, any> = {},
  ): Promise<any> {
    try {
      this.logger.log(`Creating iyzico payment for ${amount} ${currency}`);

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: metadata.conversationId || `conv_${Date.now()}`,
        price: amount.toString(),
        paidPrice: amount.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        installment: '1',
        basketId: metadata.basketId || `basket_${Date.now()}`,
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard: {
          cardHolderName: metadata.cardHolderName,
          cardNumber: metadata.cardNumber,
          expireMonth: metadata.expireMonth,
          expireYear: metadata.expireYear,
          cvc: metadata.cvc,
          registerCard: '0'
        },
        buyer: {
          id: metadata.buyerId || 'BY789',
          name: metadata.buyerName || 'John',
          surname: metadata.buyerSurname || 'Doe',
          gsmNumber: metadata.buyerGsmNumber || '+905350000000',
          email: metadata.buyerEmail || 'email@email.com',
          identityNumber: metadata.buyerIdentityNumber || '74300864791',
          lastLoginDate: '2015-10-05 12:43:35',
          registrationDate: '2013-04-21 15:12:09',
          registrationAddress: metadata.buyerAddress || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          ip: metadata.buyerIp || '85.34.78.112',
          city: metadata.buyerCity || 'Istanbul',
          country: metadata.buyerCountry || 'Turkey',
          zipCode: metadata.buyerZipCode || '34732'
        },
        shippingAddress: {
          contactName: metadata.shippingContactName || 'Jane Doe',
          city: metadata.shippingCity || 'Istanbul',
          country: metadata.shippingCountry || 'Turkey',
          address: metadata.shippingAddress || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          zipCode: metadata.shippingZipCode || '34742'
        },
        billingAddress: {
          contactName: metadata.billingContactName || 'Jane Doe',
          city: metadata.billingCity || 'Istanbul',
          country: metadata.billingCountry || 'Turkey',
          address: metadata.billingAddress || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          zipCode: metadata.billingZipCode || '34742'
        },
        basketItems: metadata.basketItems || [
          {
            id: 'BI101',
            name: 'Binocular',
            category1: 'Collectibles',
            category2: 'Accessories',
            itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
            price: amount.toString()
          }
        ]
      };

      return new Promise((resolve) => {
        this.iyzipay.payment.create(request, (err: any, result: any) => {
          if (err) {
            this.logger.error(`iyzico payment creation failed: ${err.message}`, err);
            resolve({
              success: false,
              error: err.message,
            });
          } else {
            resolve({
              success: result.status === 'success',
              paymentId: result.paymentId,
              status: result.status,
              errorCode: result.errorCode,
              errorMessage: result.errorMessage,
              result: result,
            });
          }
        });
      });
    } catch (error) {
      this.logger.error(`iyzico payment creation failed: ${error.message}`, error.stack);
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
    planId: string,
    metadata: Record<string, any> = {},
  ): Promise<any> {
    try {
      // In a real implementation, this would use the iyzico SDK
      this.logger.log(`Creating iyzico subscription for customer ${customerId} with plan ${planId}`);
      
      // Mock implementation
      const subscriptionId = `iyzico_sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      return {
        success: true,
        subscriptionId,
        status: 'active',
      };
    } catch (error) {
      this.logger.error(`iyzico subscription creation failed: ${error.message}`, error.stack);
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
      // In a real implementation, this would use the iyzico SDK
      this.logger.log(`Canceling iyzico subscription ${subscriptionId}`);
      
      // Mock implementation
      return {
        success: true,
        subscriptionId,
        status: 'canceled',
      };
    } catch (error) {
      this.logger.error(`iyzico subscription cancellation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a plan
   */
  async createPlan(
    name: string,
    price: number,
    interval: 'MONTHLY' | 'YEARLY' = 'MONTHLY',
    metadata: Record<string, any> = {},
  ): Promise<any> {
    try {
      // In a real implementation, this would use the iyzico SDK
      this.logger.log(`Creating iyzico plan ${name} with price ${price}`);
      
      // Mock implementation
      const planId = `iyzico_plan_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      return {
        success: true,
        planId,
      };
    } catch (error) {
      this.logger.error(`iyzico plan creation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify a payment
   */
  async verifyPayment(paymentId: string): Promise<any> {
    try {
      // In a real implementation, this would use the iyzico SDK
      this.logger.log(`Verifying iyzico payment ${paymentId}`);
      
      // Mock implementation
      return {
        success: true,
        paymentId,
        status: 'success',
      };
    } catch (error) {
      this.logger.error(`iyzico payment verification failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a checkout form
   */
  async createCheckoutForm(
    price: number,
    callbackUrl: string,
    metadata: Record<string, any> = {},
  ): Promise<any> {
    try {
      this.logger.log(`Creating iyzico checkout form for ${price} TRY`);

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: metadata.conversationId || `conv_${Date.now()}`,
        price: price.toString(),
        paidPrice: price.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        basketId: metadata.basketId || `basket_${Date.now()}`,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: callbackUrl,
        enabledInstallments: [2, 3, 6, 9],
        buyer: {
          id: metadata.buyerId || 'BY789',
          name: metadata.buyerName || 'John',
          surname: metadata.buyerSurname || 'Doe',
          gsmNumber: metadata.buyerGsmNumber || '+905350000000',
          email: metadata.buyerEmail || 'email@email.com',
          identityNumber: metadata.buyerIdentityNumber || '74300864791',
          lastLoginDate: '2015-10-05 12:43:35',
          registrationDate: '2013-04-21 15:12:09',
          registrationAddress: metadata.buyerAddress || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          ip: metadata.buyerIp || '85.34.78.112',
          city: metadata.buyerCity || 'Istanbul',
          country: metadata.buyerCountry || 'Turkey',
          zipCode: metadata.buyerZipCode || '34732'
        },
        shippingAddress: {
          contactName: metadata.shippingContactName || 'Jane Doe',
          city: metadata.shippingCity || 'Istanbul',
          country: metadata.shippingCountry || 'Turkey',
          address: metadata.shippingAddress || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          zipCode: metadata.shippingZipCode || '34742'
        },
        billingAddress: {
          contactName: metadata.billingContactName || 'Jane Doe',
          city: metadata.billingCity || 'Istanbul',
          country: metadata.billingCountry || 'Turkey',
          address: metadata.billingAddress || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          zipCode: metadata.billingZipCode || '34742'
        },
        basketItems: metadata.basketItems || [
          {
            id: 'BI101',
            name: 'Subscription',
            category1: 'Service',
            category2: 'Subscription',
            itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
            price: price.toString()
          }
        ]
      };

      return new Promise((resolve) => {
        this.iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
          if (err) {
            this.logger.error(`iyzico checkout form creation failed: ${err.message}`, err);
            resolve({
              success: false,
              error: err.message,
            });
          } else {
            resolve({
              success: result.status === 'success',
              token: result.token,
              checkoutFormContent: result.checkoutFormContent,
              paymentPageUrl: result.paymentPageUrl,
              status: result.status,
              errorCode: result.errorCode,
              errorMessage: result.errorMessage,
            });
          }
        });
      });
    } catch (error) {
      this.logger.error(`iyzico checkout form creation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retrieve checkout form result
   */
  async retrieveCheckoutForm(token: string): Promise<any> {
    try {
      this.logger.log(`Retrieving iyzico checkout form result for token ${token}`);

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: `conv_${Date.now()}`,
        token: token,
      };

      return new Promise((resolve) => {
        this.iyzipay.checkoutForm.retrieve(request, (err: any, result: any) => {
          if (err) {
            this.logger.error(`iyzico checkout form retrieval failed: ${err.message}`, err);
            resolve({
              success: false,
              error: err.message,
            });
          } else {
            resolve({
              success: result.status === 'success',
              token: result.token,
              status: result.status,
              paymentId: result.paymentId,
              paymentStatus: result.paymentStatus,
              fraudStatus: result.fraudStatus,
              merchantCommissionRate: result.merchantCommissionRate,
              merchantCommissionRateAmount: result.merchantCommissionRateAmount,
              iyziCommissionRateAmount: result.iyziCommissionRateAmount,
              iyziCommissionFee: result.iyziCommissionFee,
              cardType: result.cardType,
              cardAssociation: result.cardAssociation,
              cardFamily: result.cardFamily,
              binNumber: result.binNumber,
              lastFourDigits: result.lastFourDigits,
              basketId: result.basketId,
              currency: result.currency,
              price: result.price,
              paidPrice: result.paidPrice,
              installment: result.installment,
              paymentItems: result.paymentItems,
              errorCode: result.errorCode,
              errorMessage: result.errorMessage,
            });
          }
        });
      });
    } catch (error) {
      this.logger.error(`iyzico checkout form retrieval failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create a payment intent for subscription
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'TRY',
    metadata: Record<string, any> = {}
  ): Promise<any> {
    try {
      this.logger.log(`Creating iyzico payment intent for ${amount} ${currency}`);

      // For subscription payments, we'll use checkout form
      const callbackUrl = metadata.callbackUrl || `${this.baseUrl}/payment/callback`;
      return this.createCheckoutForm(amount, callbackUrl, metadata);
    } catch (error) {
      this.logger.error(`iyzico payment intent creation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
