import React, { forwardRef } from 'react';

export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaVariant = 'default' | 'filled' | 'outlined' | 'unstyled';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
 label?: string;
 helperText?: string;
 error?: string;
 size?: TextareaSize;
 variant?: TextareaVariant;
 fullWidth?: boolean;
 containerClassName?: string;
 labelClassName?: string;
 textareaClassName?: string;
 helperTextClassName?: string;
 errorClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
 label,
 helperText,
 error,
 size = 'md',
 variant = 'default',
 fullWidth = false,
 containerClassName = '',
 labelClassName = '',
 textareaClassName = '',
 helperTextClassName = '',
 errorClassName = '',
 id,
 disabled,
 required,
 ...props
}, ref) => {
 // Generate a unique ID if not provided
 const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
 
 // Size classes
 const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-2.5 text-lg',
 };
 
 // Variant classes - Updated for minimal design
 const variantClasses = {
  default: 'bg-neutral-100 border border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20',
  filled: 'bg-neutral-200 border border-transparent focus:bg-neutral-100 focus:border-primary-500 focus:ring-primary-500/20',
  outlined: 'bg-transparent border border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20',
  unstyled: 'bg-transparent border-0 focus:ring-0 p-0',
 };

 // Error classes
 const errorClasses = error
  ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20 text-danger-900'
  : '';

 // Disabled classes
 const disabledClasses = disabled
  ? 'opacity-50 cursor-not-allowed bg-neutral-200'
  : '';

 // Width classes
 const widthClasses = fullWidth ? 'w-full' : '';

 // Base classes - Updated for minimal design
 const baseClasses = 'rounded-xl shadow-sm focus:outline-none focus:ring-1 transition-all duration-200 text-primary-900 placeholder:text-neutral-500 resize-vertical';
 
 // Combine all textarea classes
 const textareaClasses = `
  ${baseClasses}
  ${sizeClasses[size]}
  ${variantClasses[variant]}
  ${errorClasses}
  ${disabledClasses}
  ${widthClasses}
  ${textareaClassName}
 `;

 return (
  <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
   {label && (
    <label
     htmlFor={textareaId}
     className={`block text-sm font-medium text-primary-700 mb-2 ${labelClassName}`}
    >
     {label}
     {required && <span className="text-danger-500 ml-1">*</span>}
    </label>
   )}
   
   <textarea
    ref={ref}
    id={textareaId}
    disabled={disabled}
    required={required}
    className={textareaClasses}
    aria-invalid={!!error}
    aria-describedby={
     error 
      ? `${textareaId}-error` 
      : helperText 
       ? `${textareaId}-helper` 
       : undefined
    }
    {...props}
   />
   
   {error ? (
    <p
     id={`${textareaId}-error`}
     className={`mt-1.5 text-xs text-danger-500 ${errorClassName}`}
    >
     {error}
    </p>
   ) : helperText ? (
    <p
     id={`${textareaId}-helper`}
     className={`mt-1.5 text-xs text-neutral-600 ${helperTextClassName}`}
    >
     {helperText}
    </p>
   ) : null}
  </div>
 );
});

Textarea.displayName = 'Textarea';

export default Textarea;
