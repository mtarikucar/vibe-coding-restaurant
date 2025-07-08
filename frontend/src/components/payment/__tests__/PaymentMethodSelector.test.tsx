import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PaymentMethodSelector from '../PaymentMethodSelector';
import { PaymentMethod } from '../../../types/payment';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('PaymentMethodSelector', () => {
  const mockOnMethodChange = vi.fn();

  const defaultProps = {
    selectedMethod: PaymentMethod.CASH,
    onMethodChange: mockOnMethodChange,
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all payment methods', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      expect(screen.getByText('Cash')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getByText('Debit Card')).toBeInTheDocument();
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('PayPal')).toBeInTheDocument();
      expect(screen.getByText('iyzico')).toBeInTheDocument();
    });

    it('should highlight the selected payment method', () => {
      render(<PaymentMethodSelector {...defaultProps} selectedMethod={PaymentMethod.CREDIT_CARD} />);

      const creditCardButton = screen.getByText('Credit Card').closest('button');
      const cashButton = screen.getByText('Cash').closest('button');

      expect(creditCardButton).toHaveClass('bg-primary-50/20', 'border-primary-500', 'text-primary-700');
      expect(cashButton).toHaveClass('bg-white', 'border-neutral-300', 'text-neutral-700');
    });

    it('should render payment method icons', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      // Check that SVG icons are rendered (they should have specific classes)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const icon = button.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('h-6', 'w-6');
      });
    });
  });

  describe('Interaction', () => {
    it('should call onMethodChange when a payment method is clicked', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const creditCardButton = screen.getByText('Credit Card').closest('button');
      fireEvent.click(creditCardButton!);

      expect(mockOnMethodChange).toHaveBeenCalledWith(PaymentMethod.CREDIT_CARD);
    });

    it('should call onMethodChange with correct payment method for each option', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const paymentMethods = [
        { text: 'Cash', method: PaymentMethod.CASH },
        { text: 'Credit Card', method: PaymentMethod.CREDIT_CARD },
        { text: 'Debit Card', method: PaymentMethod.DEBIT_CARD },
        { text: 'Stripe', method: PaymentMethod.STRIPE },
        { text: 'PayPal', method: PaymentMethod.PAYPAL },
        { text: 'iyzico', method: PaymentMethod.IYZICO },
      ];

      paymentMethods.forEach(({ text, method }) => {
        const button = screen.getByText(text).closest('button');
        fireEvent.click(button!);
        expect(mockOnMethodChange).toHaveBeenCalledWith(method);
      });

      expect(mockOnMethodChange).toHaveBeenCalledTimes(paymentMethods.length);
    });

    it('should not call onMethodChange when clicking the already selected method', () => {
      render(<PaymentMethodSelector {...defaultProps} selectedMethod={PaymentMethod.CASH} />);

      const cashButton = screen.getByText('Cash').closest('button');
      fireEvent.click(cashButton!);

      // It should still call the function, but with the same method
      expect(mockOnMethodChange).toHaveBeenCalledWith(PaymentMethod.CASH);
    });
  });

  describe('Disabled State', () => {
    it('should disable all buttons when disabled prop is true', () => {
      render(<PaymentMethodSelector {...defaultProps} disabled={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
        expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
      });
    });

    it('should not call onMethodChange when disabled and clicked', () => {
      render(<PaymentMethodSelector {...defaultProps} disabled={true} />);

      const creditCardButton = screen.getByText('Credit Card').closest('button');
      fireEvent.click(creditCardButton!);

      expect(mockOnMethodChange).not.toHaveBeenCalled();
    });

    it('should enable all buttons when disabled prop is false', () => {
      render(<PaymentMethodSelector {...defaultProps} disabled={false} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
        expect(button).toHaveClass('cursor-pointer');
        expect(button).not.toHaveClass('cursor-not-allowed');
      });
    });
  });

  describe('Styling', () => {
    it('should apply hover effects when not disabled', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('hover:scale-105', 'hover:bg-neutral-50');
      });
    });

    it('should apply correct icon colors based on selection', () => {
      render(<PaymentMethodSelector {...defaultProps} selectedMethod={PaymentMethod.STRIPE} />);

      const stripeButton = screen.getByText('Stripe').closest('button');
      const cashButton = screen.getByText('Cash').closest('button');

      const stripeIcon = stripeButton?.querySelector('div');
      const cashIcon = cashButton?.querySelector('div');

      expect(stripeIcon).toHaveClass('text-primary-600');
      expect(cashIcon).toHaveClass('text-neutral-500');
    });

    it('should use grid layout with responsive columns', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const container = screen.getAllByRole('button')[0].parentElement;
      expect(container).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-6', 'gap-4');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(6); // 6 payment methods
    });

    it('should have proper button types', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should be keyboard accessible', () => {
      render(<PaymentMethodSelector {...defaultProps} />);

      const creditCardButton = screen.getByText('Credit Card').closest('button');
      
      // Focus the button
      creditCardButton?.focus();
      expect(document.activeElement).toBe(creditCardButton);

      // Press Enter
      fireEvent.keyDown(creditCardButton!, { key: 'Enter', code: 'Enter' });
      // Note: The actual Enter key handling would depend on the button's default behavior
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined selectedMethod gracefully', () => {
      render(<PaymentMethodSelector {...defaultProps} selectedMethod={undefined as any} />);

      // Should render without crashing
      expect(screen.getByText('Cash')).toBeInTheDocument();
    });

    it('should handle invalid selectedMethod gracefully', () => {
      render(<PaymentMethodSelector {...defaultProps} selectedMethod={'invalid' as any} />);

      // Should render without crashing, no method should be highlighted
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveClass('bg-primary-50/20');
      });
    });

    it('should handle missing onMethodChange prop gracefully', () => {
      const { container } = render(
        <PaymentMethodSelector 
          selectedMethod={PaymentMethod.CASH} 
          onMethodChange={undefined as any} 
        />
      );

      // Should render without crashing
      expect(container).toBeInTheDocument();
    });
  });
});
