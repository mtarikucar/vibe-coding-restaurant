import React, { forwardRef } from"react";
import { ChevronDownIcon } from"@heroicons/react/24/outline";

export type SelectSize ="sm" | "md" | "lg";
export type SelectVariant ="default" | "filled" | "outlined" | "unstyled";

export interface SelectOption {
 value: string | number;
 label: string;
 disabled?: boolean;
}

interface SelectProps
 extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>,"size"> {
 options: SelectOption[];
 label?: string;
 helperText?: string;
 error?: string;
 size?: SelectSize;
 variant?: SelectVariant;
 fullWidth?: boolean;
 containerClassName?: string;
 labelClassName?: string;
 selectClassName?: string;
 helperTextClassName?: string;
 errorClassName?: string;
 placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
 (
  {
   options,
   label,
   helperText,
   error,
   size ="md",
   variant ="default",
   fullWidth = false,
   containerClassName ="",
   labelClassName ="",
   selectClassName ="",
   helperTextClassName ="",
   errorClassName ="",
   id,
   disabled,
   required,
   placeholder,
   ...props
  },
  ref
 ) => {
  // Generate a unique ID if not provided
  const selectId =
   id || `select-${Math.random().toString(36).substring(2, 9)}`;

  // Size classes
  const sizeClasses = {
   sm:"px-3 py-1.5 text-sm",
   md:"px-3 py-2 text-base",
   lg:"px-4 py-2.5 text-lg",
  };

  // Variant classes - Updated for minimal design
  const variantClasses = {
   default:
   "bg-neutral-100 border border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20",
   filled:
   "bg-neutral-200 border border-transparent focus:bg-neutral-100 focus:border-primary-500 focus:ring-primary-500/20",
   outlined:
   "bg-transparent border border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20",
   unstyled:"bg-transparent border-0 focus:ring-0 p-0",
  };

  // Error classes
  const errorClasses = error
   ?"border-danger-500 focus:border-danger-500 focus:ring-danger-500/20 text-danger-900"
   :"";

  // Disabled classes
  const disabledClasses = disabled
   ?"opacity-50 cursor-not-allowed bg-neutral-200"
   :"";

  // Width classes
  const widthClasses = fullWidth ?"w-full" : "";

  // Base classes - Updated for minimal design
  const baseClasses =
  "rounded-xl shadow-sm focus:outline-none focus:ring-1 transition-all duration-200 appearance-none pr-10 text-primary-900";

  // Combine all select classes
  const selectClasses = `
  ${baseClasses}
  ${sizeClasses[size]}
  ${variantClasses[variant]}
  ${errorClasses}
  ${disabledClasses}
  ${widthClasses}
  ${selectClassName}
 `;

  return (
   <div className={`${fullWidth ?"w-full" : ""} ${containerClassName}`}>
    {label && (
     <label
      htmlFor={selectId}
      className={`block text-sm font-medium text-primary-700 mb-2 ${labelClassName}`}
     >
      {label}
      {required && <span className="text-danger-500 ml-1">*</span>}
     </label>
    )}

    <div className="relative">
     <select
      ref={ref}
      id={selectId}
      disabled={disabled}
      required={required}
      className={selectClasses}
      aria-invalid={!!error}
      aria-describedby={
       error
        ? `${selectId}-error`
        : helperText
        ? `${selectId}-helper`
        : undefined
      }
      {...props}
     >
      {placeholder && (
       <option value="" disabled>
        {placeholder}
       </option>
      )}
      {options.map((option) => (
       <option
        key={option.value}
        value={option.value}
        disabled={option.disabled}
       >
        {option.label}
       </option>
      ))}
     </select>

     <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
      <ChevronDownIcon
       className="h-5 w-5 text-gray-400"
       aria-hidden="true"
      />
     </div>
    </div>

    {error ? (
     <p
      id={`${selectId}-error`}
      className={`mt-1.5 text-xs text-danger-500 ${errorClassName}`}
     >
      {error}
     </p>
    ) : helperText ? (
     <p
      id={`${selectId}-helper`}
      className={`mt-1.5 text-xs text-neutral-600 ${helperTextClassName}`}
     >
      {helperText}
     </p>
    ) : null}
   </div>
  );
 }
);

Select.displayName ="Select";

export default Select;
