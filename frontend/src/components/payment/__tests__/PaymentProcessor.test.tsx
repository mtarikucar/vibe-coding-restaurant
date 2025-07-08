import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

// Mock payment components
vi.mock('../PayPalPayment', () => ({
  default: ({ onSuccess, onError }: any) => (
    <div data-testid="paypal-payment">
      <button onClick={onSuccess}>PayPal Success</button>
      <button onClick={() => onError('PayPal Error')}>PayPal Error</button>
    </div>
  ),
}));

vi.mock('../StripePayment', () => ({
  default: ({ onSuccess, onError }: any) => (
    <div data-testid="stripe-payment">
      <button onClick={onSuccess}>Stripe Success</button>
      <button onClick={() => onError('Stripe Error')}>Stripe Error</button>
    </div>
  ),
}));

vi.mock('../IyzicoPayment', () => ({
  default: ({ onSuccess, onError }: any) => (
    <div data-testid="iyzico-payment">
      <button onClick={onSuccess}>Iyzico Success</button>
      <button onClick={() => onError('Iyzico Error')}>Iyzico Error</button>
    </div>
  ),
}));

describe('PaymentProcessor', () => {
  const mockUser = {
    id: 'user-id',
    fullName: 'Test User',
  };

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

  afterEach(() => {
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
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);
      (api.paymentAPI.processPayment as any).mockRejectedValue(new Error('Card declined'));

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.CREDIT_CARD} />);

      await waitFor(() => {
        expect(mockProps.onPaymentError).toHaveBeenCalledWith('Card declined');
      });
    });
  });

  describe('PayPal Payment', () => {
    it('should render PayPal payment component', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.PAYPAL,
        paymentDetails: { paymentIntentId: 'pi_test', requiresAction: true },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.PAYPAL} />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Processing payment...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('paypal-payment')).toBeInTheDocument();
      });
    });

    it('should handle PayPal payment success', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.PAYPAL,
        paymentDetails: { paymentIntentId: 'pi_test', requiresAction: true },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.PAYPAL} />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Processing payment...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('paypal-payment')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('PayPal Success'));

      expect(mockProps.onPaymentComplete).toHaveBeenCalled();
    });

    it('should handle PayPal payment error', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.PAYPAL,
        paymentDetails: { paymentIntentId: 'pi_test', requiresAction: true },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.PAYPAL} />);

      await waitFor(() => {
        expect(screen.getByTestId('paypal-payment')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('PayPal Error'));

      expect(mockProps.onPaymentError).toHaveBeenCalledWith('PayPal Error');
    });
  });

  describe('Stripe Payment', () => {
    it('should render Stripe payment component', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.STRIPE,
        paymentDetails: { paymentIntentId: 'pi_test', requiresAction: true },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.STRIPE} />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-payment')).toBeInTheDocument();
      });
    });

    it('should handle Stripe payment success', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.STRIPE,
        paymentDetails: { paymentIntentId: 'pi_test', requiresAction: true },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.STRIPE} />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-payment')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Stripe Success'));

      expect(mockProps.onPaymentComplete).toHaveBeenCalled();
    });
  });

  describe('Iyzico Payment', () => {
    it('should render Iyzico payment component', async () => {
      const mockPayment = {
        id: 'payment-id',
        status: 'pending',
        method: PaymentMethod.IYZICO,
        paymentDetails: { paymentIntentId: 'pi_test', requiresAction: true },
      };

      (api.paymentAPI.createPayment as any).mockResolvedValue(mockPayment);

      render(<PaymentProcessor {...mockProps} paymentMethod={PaymentMethod.IYZICO} />);

      await waitFor(() => {
        expect(screen.getByTestId('iyzico-payment')).toBeInTheDocument();
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
});
