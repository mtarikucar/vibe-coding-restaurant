import React, { forwardRef } from "react";

export type InputSize = "sm" | "md" | "lg";
export type InputVariant = "default" | "filled" | "outlined" | "unstyled";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: InputSize;
  variant?: InputVariant;
  fullWidth?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  helperTextClassName?: string;
  errorClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      size = "md",
      variant = "default",
      fullWidth = false,
      containerClassName = "",
      labelClassName = "",
      inputClassName = "",
      helperTextClassName = "",
      errorClassName = "",
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    // Generate a unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    // Size classes
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-3 py-2 text-base",
      lg: "px-4 py-2.5 text-lg",
    };

    // Variant classes - Updated for minimal design
    const variantClasses = {
      default:
        "bg-neutral-100 dark:bg-darkGray-800 border border-neutral-300 dark:border-darkGray-700 focus:border-primary-500 focus:ring-primary-500/20",
      filled:
        "bg-neutral-200 dark:bg-darkGray-700 border border-transparent focus:bg-neutral-100 dark:focus:bg-darkGray-800 focus:border-primary-500 focus:ring-primary-500/20",
      outlined:
        "bg-transparent border border-neutral-300 dark:border-darkGray-700 focus:border-primary-500 focus:ring-primary-500/20",
      unstyled: "bg-transparent border-0 focus:ring-0 p-0",
    };

    // Error classes
    const errorClasses = error
      ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20 text-danger-900 dark:text-danger-400"
      : "";

    // Disabled classes
    const disabledClasses = disabled
      ? "opacity-50 cursor-not-allowed bg-neutral-200 dark:bg-darkGray-700"
      : "";

    // Width classes
    const widthClasses = fullWidth ? "w-full" : "";

    // Icon padding classes
    const leftIconPadding = leftIcon ? "pl-10" : "";
    const rightIconPadding = rightIcon ? "pr-10" : "";

    // Base classes - Updated for minimal design
    const baseClasses =
      "rounded-xl shadow-sm focus:outline-none focus:ring-1 transition-all duration-200 text-primary-900 dark:text-neutral-100 placeholder:text-neutral-500 dark:placeholder:text-neutral-400";

    // Combine all input classes
    const inputClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${errorClasses}
    ${disabledClasses}
    ${widthClasses}
    ${leftIconPadding}
    ${rightIconPadding}
    ${inputClassName}
  `;

    return (
      <div className={`${fullWidth ? "w-full" : ""} ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium text-primary-700 dark:text-neutral-300 mb-2 ${labelClassName}`}
          >
            {label}
            {required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p
            id={`${inputId}-error`}
            className={`mt-1.5 text-xs text-danger-500 dark:text-danger-400 ${errorClassName}`}
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${inputId}-helper`}
            className={`mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 ${helperTextClassName}`}
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
