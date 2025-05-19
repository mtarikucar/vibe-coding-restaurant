import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET', '');
    this.baseUrl = this.configService.get<string>(
      'PAYPAL_BASE_URL',
      'https://api-m.sandbox.paypal.com'
    );
    
    this.logger.log(`PayPal service initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Get an access token from PayPal
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set token expiry (subtract 5 minutes to be safe)
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
      
      return this.accessToken;
    } catch (error) {
      this.logger.error(`Failed to get PayPal access token: ${error.message}`, error.stack);
      throw new Error(`PayPal authentication failed: ${error.message}`);
    }
  }

  /**
   * Create a payment
   */
  async createPayment(
    amount: number,
    currency: string = 'USD',
    metadata: Record<string, any> = {},
  ): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2),
            },
            reference_id: metadata.orderId || `order_${Date.now()}`,
            description: metadata.description || 'Restaurant order payment',
            custom_id: metadata.customId || `custom_${Date.now()}`,
          },
        ],
        application_context: {
          brand_name: this.configService.get('APP_NAME', 'Restaurant Management System'),
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: metadata.returnUrl || `${this.configService.get('FRONTEND_URL', 'http://localhost:5173')}/payment/success`,
          cancel_url: metadata.cancelUrl || `${this.configService.get('FRONTEND_URL', 'http://localhost:5173')}/payment/cancel`,
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      // Find the approval URL
      const approvalUrl = response.data.links.find(link => link.rel === 'approve').href;

      return {
        success: true,
        paymentId: response.data.id,
        status: response.data.status,
        redirectUrl: approvalUrl,
      };
    } catch (error) {
      this.logger.error(`PayPal payment creation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Capture a payment
   */
  async capturePayment(paymentId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders/${paymentId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        paymentId: response.data.id,
        status: response.data.status,
        captureId: response.data.purchase_units[0].payments.captures[0].id,
      };
    } catch (error) {
      this.logger.error(`PayPal payment capture failed: ${error.message}`, error.stack);
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
      const accessToken = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseUrl}/v2/checkout/orders/${paymentId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        paymentId: response.data.id,
        status: response.data.status,
      };
    } catch (error) {
      this.logger.error(`PayPal payment verification failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(captureId: string, amount?: number, currency: string = 'USD'): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const payload = amount ? {
        amount: {
          value: amount.toFixed(2),
          currency_code: currency.toUpperCase(),
        },
      } : {};

      const response = await axios.post(
        `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        refundId: response.data.id,
        status: response.data.status,
      };
    } catch (error) {
      this.logger.error(`PayPal payment refund failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
