import { useState } from "react";
import {
  CreditCardIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  CreditCardIcon as CreditCardOutlineIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import { PaymentMethod } from "../../types/payment";

// Export the type for backward compatibility
export type { PaymentMethod };

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
  const { t } = useTranslation();

  const methods: { id: PaymentMethod; name: string; icon: React.ReactNode }[] =
    [
      {
        id: PaymentMethod.CASH,
        name: t("payments.methods.cash", "Cash"),
        icon: <BanknotesIcon className="h-6 w-6" />,
      },
      {
        id: PaymentMethod.CREDIT_CARD,
        name: t("payments.methods.creditCard", "Credit Card"),
        icon: <CreditCardIcon className="h-6 w-6" />,
      },
      {
        id: PaymentMethod.DEBIT_CARD,
        name: t("payments.methods.debitCard", "Debit Card"),
        icon: <CreditCardOutlineIcon className="h-6 w-6" />,
      },
      {
        id: PaymentMethod.STRIPE,
        name: t("payments.methods.stripe", "Stripe"),
        icon: <CurrencyDollarIcon className="h-6 w-6" />,
      },
      {
        id: PaymentMethod.PAYPAL,
        name: t("payments.methods.paypal", "PayPal"),
        icon: <CurrencyDollarIcon className="h-6 w-6" />,
      },
      {
        id: PaymentMethod.IYZICO,
        name: t("payments.methods.iyzico", "iyzico"),
        icon: <CreditCardIcon className="h-6 w-6" />,
      },
    ];

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {t("payment.paymentMethod", "Payment Method")}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all hover:scale-105 ${
              selectedMethod === method.id
                ? "bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-300 shadow-md"
                : "bg-white dark:bg-darkGray-700 border-neutral-300 dark:border-darkGray-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-darkGray-600"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onClick={() => !disabled && onMethodChange(method.id)}
            disabled={disabled}
          >
            <div
              className={`${
                selectedMethod === method.id
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {method.icon}
            </div>
            <span className="mt-2 text-sm font-medium">{method.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
