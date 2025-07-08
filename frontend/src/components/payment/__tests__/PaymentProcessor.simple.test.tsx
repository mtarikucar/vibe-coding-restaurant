import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PaymentProcessor from '../PaymentProcessor';
import { PaymentMethod } from '../../../types/payment';
import * as api from '../../../services/api';

// Mock the API
vi.mock('../../../services/api', () => ({
  paymentAPI: {
    createPayment: vi.fn(),
    processPayment: vi.fn(),
  },
}));

// Mock the auth store
vi.mock('../../../store/authStore', () => ({
  default: () => ({
    user: {
      id: 'user-id',
      fullName: 'Test User',
    },
  }),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options?.amount) {
        return `Pay ${options.amount}`;
      }
      return key;
    },
  }),
}));

describe('PaymentProcessor - Simple Tests', () => {
  const mockProps = {
    orderId: 'test-order-id',
    orderTotal: 100.50,
    onPaymentComplete: vi.fn(),
    onPaymentError: vi.fn(),
    paymentMethod: PaymentMethod.CASH,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cash Payment', () => {
    it('should handle cash payment successfully', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'completed',
        method: PaymentMethod.CASH,
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.CASH} />);

      await waitFor(() => {
        expect(api.paymentAPI.createPayment).toHaveBeenCalledWith(
          'test-order-id',
          PaymentMethod.CASH,
          'user-id',
          100.50
        );
      });

      await waitFor(() => {
        expect(mockProps.onPaymentComplete).toHaveBeenCalled();
      });
    });

    it('should handle cash payment creation error', async () => {
      const error = new Error('Payment creation failed');
      (api.paymentAPI.createPayment as any).mockRejectedValue(error);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.CASH} />);

      await waitFor(() => {
        expect(mockProps.onPaymentError).toHaveBeenCalledWith('Payment creation failed');
      });
    });
  });

  describe('Card Payment', () => {
    it('should handle card payment initialization', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.CREDIT_CARD,
        paymentDetails: { requiresAction: false },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);
      (api.paymentAPI.processPayment as any).mockResolvedValue({
        ...mockPayment,
        status: 'completed',
      });

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.CREDIT_CARD} />);

      await waitFor(() => {
        expect(api.paymentAPI.createPayment).toHaveBeenCalledWith(
          'test-order-id',
          PaymentMethod.CREDIT_CARD,
          'user-id',
          100.50
        );
      });

      await waitFor(() => {
        expect(api.paymentAPI.processPayment).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockProps.onPaymentComplete).toHaveBeenCalled();
      });
    });

    it('should handle card payment processing error', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.CREDIT_CARD,
        paymentDetails: { requiresAction: false },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);
      (api.paymentAPI.processPayment as any).mockRejectedValue(new Error('Card declined'));

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.CREDIT_CARD} />);

      await waitFor(() => {
        expect(mockProps.onPaymentError).toHaveBeenCalledWith('Card declined');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid amount error', async () => {
      const error = new Error('amount must be a number conforming to the specified constraints');
      (api.paymentAPI.createPayment as any).mockRejectedValue(error);

      render(<PaymentProcessor {...mockProps} />);

      await waitFor(() => {
        expect(mockProps.onPaymentError).toHaveBeenCalledWith(
          'amount must be a number conforming to the specified constraints'
        );
      });
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      (api.paymentAPI.createPayment as any).mockRejectedValue(error);

      render(<PaymentProcessor {...mockProps} />);

      await waitFor(() => {
        expect(mockProps.onPaymentError).toHaveBeenCalledWith('Network Error');
      });
    });

    it('should handle missing user error', async () => {
      // Override the mock for this test to return null user
      vi.doMock('../../../store/authStore', () => ({
        default: () => ({
          user: null,
        }),
      }));

      // Mock API to throw error when user is null
      (api.paymentAPI.createPayment as any).mockRejectedValue(
        new Error('User not authenticated')
      );

      render(<PaymentProcessor {...mockProps} />);

      await waitFor(() => {
        expect(mockProps.onPaymentError).toHaveBeenCalledWith(
          'User not authenticated'
        );
      });
    });
  });

  describe('Payment Method Initialization', () => {
    it('should initialize PayPal payment', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.PAYPAL,
        paymentDetails: { paymentIntentId: 'pi_test' },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.PAYPAL} />);

      await waitFor(() => {
        expect(api.paymentAPI.createPayment).toHaveBeenCalledWith(
          'test-order-id',
          PaymentMethod.PAYPAL,
          'user-id',
          100.50
        );
      });
    });

    it('should initialize Stripe payment', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.STRIPE,
        paymentDetails: { paymentIntentId: 'pi_test' },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.STRIPE} />);

      await waitFor(() => {
        expect(api.paymentAPI.createPayment).toHaveBeenCalledWith(
          'test-order-id',
          PaymentMethod.STRIPE,
          'user-id',
          100.50
        );
      });
    });

    it('should initialize Iyzico payment', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.IYZICO,
        paymentDetails: { paymentIntentId: 'pi_test' },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.IYZICO} />);

      await waitFor(() => {
        expect(api.paymentAPI.createPayment).toHaveBeenCalledWith(
          'test-order-id',
          PaymentMethod.IYZICO,
          'user-id',
          100.50
        );
      });
    });
  });
});
