import React from "react";

export type CardVariant = "default" | "outlined" | "elevated" | "flat";

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  onClick?: () => void;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  variant = "default",
  className = "",
  bodyClassName = "",
  headerClassName = "",
  footerClassName = "",
  onClick,
  hoverable = false,
  bordered = false,
  compact = false,
}) => {
  // Variant classes
  const variantClasses = {
    default: "bg-neutral-100 shadow-card dark:bg-darkGray-800",
    outlined:
      "bg-neutral-100 border border-neutral-200 dark:bg-darkGray-800 dark:border-darkGray-700",
    elevated: "bg-neutral-100 shadow-soft dark:bg-darkGray-800",
    flat: "bg-neutral-50 dark:bg-darkGray-900",
  };

  // Base classes
  const baseClasses = "rounded-xl overflow-hidden transition-all duration-200";

  // Interactive classes
  const interactiveClasses =
    onClick || hoverable
      ? "cursor-pointer hover:shadow-soft active:shadow-card"
      : "";

  // Border classes
  const borderClasses =
    bordered && variant !== "outlined" ? "border border-gray-200" : "";

  // Padding classes
  const paddingClasses = compact ? "p-3" : "p-5";

  // Combine all classes
  const cardClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${interactiveClasses}
    ${borderClasses}
    ${className}
  `;

  // Header rendering
  const renderHeader = () => {
    if (!title && !subtitle) return null;

    return (
      <div className={`mb-4 ${headerClassName}`}>
        {title &&
          (typeof title === "string" ? (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          ) : (
            title
          ))}
        {subtitle &&
          (typeof subtitle === "string" ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : (
            subtitle
          ))}
      </div>
    );
  };

  // Footer rendering
  const renderFooter = () => {
    if (!footer) return null;

    return (
      <div className={`mt-4 pt-3 border-t border-gray-200 ${footerClassName}`}>
        {footer}
      </div>
    );
  };

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className={paddingClasses}>
        {renderHeader()}
        <div className={bodyClassName}>{children}</div>
        {renderFooter()}
      </div>
    </div>
  );
};

export default Card;
