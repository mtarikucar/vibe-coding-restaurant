import React from 'react';
import { Link } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: 'button' | 'a' | 'link';
  to?: string;
  href?: string;
  external?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  as = 'button',
  to,
  href,
  external = false,
  disabled,
  ...props
}) => {
  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 active:bg-primary-800',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-800 focus:ring-secondary-500 active:bg-secondary-300',
    success: 'bg-success-600 hover:bg-success-700 text-white focus:ring-success-500 active:bg-success-800',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white focus:ring-danger-500 active:bg-danger-800',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white focus:ring-warning-400 active:bg-warning-700',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 active:bg-gray-100',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500 active:bg-gray-200',
  };

  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

  // Full width class
  const widthClass = fullWidth ? 'w-full' : '';

  // Combine all classes
  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`;

  // Loading state
  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Render based on the 'as' prop
  if (as === 'link' && to) {
    return (
      <Link to={to} className={buttonClasses} {...(props as any)}>
        {isLoading && loadingSpinner}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Link>
    );
  }

  if (as === 'a' && href) {
    return (
      <a 
        href={href} 
        className={buttonClasses} 
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        {...(props as any)}
      >
        {isLoading && loadingSpinner}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </a>
    );
  }

  return (
    <button className={buttonClasses} disabled={isLoading || disabled} {...props}>
      {isLoading && loadingSpinner}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;
