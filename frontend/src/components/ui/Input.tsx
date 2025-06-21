import React, { forwardRef } from"react";

export type InputSize ="sm" | "md" | "lg";
export type InputVariant ="default" | "filled" | "outlined" | "unstyled";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
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
   size ="md",
   variant ="default",
   fullWidth = false,
   containerClassName ="",
   labelClassName ="",
   inputClassName ="",
   helperTextClassName ="",
   errorClassName ="",
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
   sm:"px-3 py-1.5 text-sm",
   md:"px-3 py-2 text-base",
   lg:"px-4 py-2.5 text-lg",
  };

  // Variant classes - Minimal and modern design
  const variantClasses = {
   default:
   "bg-white border border-gray-200 focus:border-orange-500 focus:ring-orange-500/10 hover:border-gray-300",
   filled:
   "bg-gray-50 border border-transparent focus:bg-white focus:border-orange-500 focus:ring-orange-500/10",
   outlined:
   "bg-transparent border border-gray-200 focus:border-orange-500 focus:ring-orange-500/10 hover:border-gray-300",
   unstyled:"bg-transparent border-0 focus:ring-0 p-0",
  };

  // Error classes
  const errorClasses = error
   ?"border-red-500 focus:border-red-500 focus:ring-red-500/10 text-red-900"
   :"";

  // Disabled classes
  const disabledClasses = disabled
   ?"opacity-60 cursor-not-allowed bg-gray-100"
   :"";

  // Width classes
  const widthClasses = fullWidth ?"w-full" : "";

  // Icon padding classes
  const leftIconPadding = leftIcon ?"pl-10" : "";
  const rightIconPadding = rightIcon ?"pr-10" : "";

  // Base classes - Minimal and clean design
  const baseClasses =
  "rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-gray-900 placeholder:text-gray-500 font-medium";

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
   <div className={`${fullWidth ?"w-full" : ""} ${containerClassName}`}>
    {label && (
     <label
      htmlFor={inputId}
      className={`block text-sm font-semibold text-gray-700 mb-2 ${labelClassName}`}
     >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
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
      className={`mt-2 text-sm text-red-500 font-medium ${errorClassName}`}
     >
      {error}
     </p>
    ) : helperText ? (
     <p
      id={`${inputId}-helper`}
      className={`mt-2 text-sm text-gray-600 ${helperTextClassName}`}
     >
      {helperText}
     </p>
    ) : null}
   </div>
  );
 }
);

Input.displayName ="Input";

export default Input;
