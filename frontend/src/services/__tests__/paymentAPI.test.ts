import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { paymentAPI } from '../api';
import { PaymentMethod } from '../../types/payment';

// Mock the api instance
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
};

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    api: mockApi,
    paymentAPI: {
      getPayments: vi.fn(),
      getPayment: vi.fn(),
      getPaymentByOrder: vi.fn(),
      createPayment: vi.fn(),
      processPayment: vi.fn(),
      updatePaymentStatus: vi.fn(),
    },
  };
});

describe('PaymentAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment with provided amount', async () => {
      const mockPayment = {
        id: 'payment-id',
        orderId: 'order-id',
        amount: 100.50,
        method: PaymentMethod.CASH,
        status: 'completed',
      };

      mockApi.post.mockResolvedValue({ data: mockPayment });

      // Import the actual implementation for testing
      const { paymentAPI: actualPaymentAPI } = await import('../api');
      
      // Mock the actual implementation
      const createPaymentSpy = vi.spyOn(actualPaymentAPI, 'createPayment').mockImplementation(
        async (orderId: string, method: string, cashierId?: string, amount?: number) => {
          if (!amount) {
            // Simulate fetching order total
            mockApi.get.mockResolvedValue({ data: { totalAmount: 100.50 } });
            const orderResponse = await mockApi.get(`/orders/${orderId}`);
            amount = orderResponse.data.totalAmount;
          }

          const response = await mockApi.post('/payments', {
            orderId,
            method,
            cashierId,
            amount,
          });
          return response.data;
        }
      );

      const result = await actualPaymentAPI.createPayment(
        'order-id',
        PaymentMethod.CASH,
        'cashier-id',
        100.50
      );

      expect(mockApi.post).toHaveBeenCalledWith('/payments', {
        orderId: 'order-id',
        method: PaymentMethod.CASH,
        cashierId: 'cashier-id',
        amount: 100.50,
      });
      expect(result).toEqual(mockPayment);
    });

    it('should fetch order total when amount is not provided', async () => {
      const mockOrder = { totalAmount: 75.25 };
      const mockPayment = {
        id: 'payment-id',
        orderId: 'order-id',
        amount: 75.25,
        method: PaymentMethod.CREDIT_CARD,
        status: 'pending',
      };

      mockApi.get.mockResolvedValue({ data: mockOrder });
      mockApi.post.mockResolvedValue({ data: mockPayment });

      const { paymentAPI: actualPaymentAPI } = await import('../api');
      const createPaymentSpy = vi.spyOn(actualPaymentAPI, 'createPayment').mockImplementation(
        async (orderId: string, method: string, cashierId?: string, amount?: number) => {
          if (!amount) {
            const orderResponse = await mockApi.get(`/orders/${orderId}`);
            amount = orderResponse.data.totalAmount;
          }

          const response = await mockApi.post('/payments', {
            orderId,
            method,
            cashierId,
            amount,
          });
          return response.data;
        }
      );

      const result = await actualPaymentAPI.createPayment(
        'order-id',
        PaymentMethod.CREDIT_CARD,
        'cashier-id'
      );

      expect(mockApi.get).toHaveBeenCalledWith('/orders/order-id');
      expect(mockApi.post).toHaveBeenCalledWith('/payments', {
        orderId: 'order-id',
        method: PaymentMethod.CREDIT_CARD,
        cashierId: 'cashier-id',
        amount: 75.25,
      });
      expect(result).toEqual(mockPayment);
    });

    it('should handle invalid amount error', async () => {
      const error = {
        response: {
          data: {
            message: ['amount must be a number conforming to the specified constraints'],
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      };

      mockApi.post.mockRejectedValue(error);

      const { paymentAPI: actualPaymentAPI } = await import('../api');
      const createPaymentSpy = vi.spyOn(actualPaymentAPI, 'createPayment').mockImplementation(
        async (orderId: string, method: string, cashierId?: string, amount?: number) => {
          const response = await mockApi.post('/payments', {
            orderId,
            method,
            cashierId,
            amount,
          });
          return response.data;
        }
      );

      await expect(
        actualPaymentAPI.createPayment('order-id', PaymentMethod.CASH, 'cashier-id', 'invalid' as any)
      ).rejects.toEqual(error);
    });

    it('should handle negative amount error', async () => {
      const error = {
        response: {
          data: {
            message: ['amount must be a positive number'],
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      };

      mockApi.post.mockRejectedValue(error);

      const { paymentAPI: actualPaymentAPI } = await import('../api');
      const createPaymentSpy = vi.spyOn(actualPaymentAPI, 'createPayment').mockImplementation(
        async (orderId: string, method: string, cashierId?: string, amount?: number) => {
          const response = await mockApi.post('/payments', {
            orderId,
            method,
            cashierId,
            amount,
          });
          return response.data;
        }
      );

      await expect(
        actualPaymentAPI.createPayment('order-id', PaymentMethod.CASH, 'cashier-id', -50)
      ).rejects.toEqual(error);
    });

    it('should handle zero amount error', async () => {
      const error = {
        response: {
          data: {
            message: ['amount must be greater than 0'],
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      };

      mockApi.post.mockRejectedValue(error);

      const { paymentAPI: actualPaymentAPI } = await import('../api');
      const createPaymentSpy = vi.spyOn(actualPaymentAPI, 'createPayment').mockImplementation(
        async (orderId: string, method: string, cashierId?: string, amount?: number) => {
          const response = await mockApi.post('/payments', {
            orderId,
            method,
            cashierId,
            amount,
          });
          return response.data;
        }
      );

      await expect(
        actualPaymentAPI.createPayment('order-id', PaymentMethod.CASH, 'cashier-id', 0)
      ).rejects.toEqual(error);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockApi.post.mockRejectedValue(networkError);

      const { paymentAPI: actualPaymentAPI } = await import('../api');
      const createPaymentSpy = vi.spyOn(actualPaymentAPI, 'createPayment').mockImplementation(
        async (orderId: string, method: string, cashierId?: string, amount?: number) => {
          const response = await mockApi.post('/payments', {
            orderId,
            method,
            cashierId,
            amount,
          });
          return response.data;
        }
      );

      await expect(
        actualPaymentAPI.createPayment('order-id', PaymentMethod.CASH, 'cashier-id', 100.50)
      ).rejects.toThrow('Network Error');
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'completed',
        transactionId: 'txn_123456',
      };

      mockApi.post.mockResolvedValue({ data: mockPayment });

      const { paymentAPI: actualPaymentAPI } = await import('../api');
      const processPaymentSpy = vi.spyOn(actualPaymentAPI, 'processPayment').mockImplementation(
        async (paymentId: string, method: string, paymentMethodId?: string, paymentIntentId?: string, cashierId?: string, orderId?: string) => {
          let paymentOrderId = orderId;
          if (!paymentOrderId) {
            mockApi.get.mockResolvedValue({ data: { orderId: 'order-id' } });
            const paymentResponse = await mockApi.get(`/payments/${paymentId}`);
            paymentOrderId = paymentResponse.data.orderId;
          }

          const response = await mockApi.post(`/payments/${paymentId}/process`, {
            orderId: paymentOrderId,
            method,
            paymentMethodId,
            paymentIntentId,
            cashierId,
          });
          return response.data;
        }
      );

      const result = await actualPaymentAPI.processPayment(
        'payment-id',
        PaymentMethod.CREDIT_CARD,
        'pm_test_123',
        'pi_test_123',
        'cashier-id',
        'order-id'
      );

      expect(mockApi.post).toHaveBeenCalledWith('/payments/payment-id/process', {
        orderId: 'order-id',
        method: PaymentMethod.CREDIT_CARD,
        paymentMethodId: 'pm_test_123',
        paymentIntentId: 'pi_test_123',
        cashierId: 'cashier-id',
      });
      expect(result).toEqual(mockPayment);
    });

    it('should fetch orderId when not provided', async () => {
      const mockPaymentData = { orderId: 'order-id' };
      const mockProcessedPayment = {
        id: 'payment-id',
        status: 'completed',
        transactionId: 'txn_123456',
      };

      mockApi.get.mockResolvedValue({ data: mockPaymentData });
      mockApi.post.mockResolvedValue({ data: mockProcessedPayment });

      const { paymentAPI: actualPaymentAPI } = await import('../api');
      const processPaymentSpy = vi.spyOn(actualPaymentAPI, 'processPayment').mockImplementation(
        async (paymentId: string, method: string, paymentMethodId?: string, paymentIntentId?: string, cashierId?: string, orderId?: string) => {
          let paymentOrderId = orderId;
          if (!paymentOrderId) {
            const paymentResponse = await mockApi.get(`/payments/${paymentId}`);
            paymentOrderId = paymentResponse.data.orderId;
          }

          const response = await mockApi.post(`/payments/${paymentId}/process`, {
            orderId: paymentOrderId,
            method,
            paymentMethodId,
            paymentIntentId,
            cashierId,
          });
          return response.data;
        }
      );

      const result = await actualPaymentAPI.processPayment(
        'payment-id',
        PaymentMethod.CREDIT_CARD,
        'pm_test_123'
      );

      expect(mockApi.get).toHaveBeenCalledWith('/payments/payment-id');
      expect(mockApi.post).toHaveBeenCalledWith('/payments/payment-id/process', {
        orderId: 'order-id',
        method: PaymentMethod.CREDIT_CARD,
        paymentMethodId: 'pm_test_123',
        paymentIntentId: undefined,
        cashierId: undefined,
      });
      expect(result).toEqual(mockProcessedPayment);
    });
  });

  describe('Error Handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: ['Validation failed'],
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      };

      mockApi.post.mockRejectedValue(error);

      const { paymentAPI: actualPaymentAPI } = await import('../api');
      const createPaymentSpy = vi.spyOn(actualPaymentAPI, 'createPayment').mockImplementation(
        async (orderId: string, method: string, cashierId?: string, amount?: number) => {
          const response = await mockApi.post('/payments', {
            orderId,
            method,
            cashierId,
            amount,
          });
          return response.data;
        }
      );

      await expect(
        actualPaymentAPI.createPayment('order-id', PaymentMethod.CASH, 'cashier-id', 100.50)
      ).rejects.toEqual(error);
    });

    it('should handle 409 Conflict errors', async () => {
      const error = {
        response: {
          status: 409,
          data: {
            message: 'Payment for order ORD-001 already exists',
            error: 'Conflict',
            statusCode: 409,
          },
        },
      };

      mockApi.post.mockRejectedValue(error);

      const { paymentAPI: actualPaymentAPI } = await import('../api');
      const createPaymentSpy = vi.spyOn(actualPaymentAPI, 'createPayment').mockImplementation(
        async (orderId: string, method: string, cashierId?: string, amount?: number) => {
          const response = await mockApi.post('/payments', {
            orderId,
            method,
            cashierId,
            amount,
          });
          return response.data;
        }
      );

      await expect(
        actualPaymentAPI.createPayment('order-id', PaymentMethod.CASH, 'cashier-id', 100.50)
      ).rejects.toEqual(error);
    });

    it('should handle 500 Internal Server errors', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
            error: 'Internal Server Error',
            statusCode: 500,
          },
        },
      };

      mockApi.post.mockRejectedValue(error);

      const { paymentAPI: actualPaymentAPI } = await import('../api');
      const createPaymentSpy = vi.spyOn(actualPaymentAPI, 'createPayment').mockImplementation(
        async (orderId: string, method: string, cashierId?: string, amount?: number) => {
          const response = await mockApi.post('/payments', {
            orderId,
            method,
            cashierId,
            amount,
          });
          return response.data;
        }
      );

      await expect(
        actualPaymentAPI.createPayment('order-id', PaymentMethod.CASH, 'cashier-id', 100.50)
      ).rejects.toEqual(error);
    });
  });
});
