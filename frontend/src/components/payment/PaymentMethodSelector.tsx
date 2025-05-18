import { useState } from 'react';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  CurrencyDollarIcon,
  CreditCardIcon as CreditCardOutlineIcon
} from '@heroicons/react/24/outline';

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'stripe' | 'paypal';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  disabled = false,
}) => {
  const methods: { id: PaymentMethod; name: string; icon: React.ReactNode }[] = [
    {
      id: 'cash',
      name: 'Cash',
      icon: <BanknotesIcon className="h-6 w-6" />,
    },
    {
      id: 'credit_card',
      name: 'Credit Card',
      icon: <CreditCardIcon className="h-6 w-6" />,
    },
    {
      id: 'debit_card',
      name: 'Debit Card',
      icon: <CreditCardOutlineIcon className="h-6 w-6" />,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <CurrencyDollarIcon className="h-6 w-6" />,
    },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            className={`flex flex-col items-center justify-center p-4 border rounded-lg transition-colors ${
              selectedMethod === method.id
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && onMethodChange(method.id)}
            disabled={disabled}
          >
            {method.icon}
            <span className="mt-2 text-sm">{method.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
