import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
};

const variants = {
  primary: "bg-aq-accent text-aq-bg-deep hover:bg-aq-accent-strong",
  secondary: "bg-aq-surface border border-aq-strong text-aq-title hover:bg-aq-surface-soft",
  danger: "bg-aq-danger text-white hover:bg-opacity-90",
  success: "bg-aq-success text-white hover:bg-opacity-90",
  ghost: "text-aq-accent hover:bg-aq-surface border border-transparent hover:border-aq",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-aq
        font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {icon && !loading && <span>{icon}</span>}
      {children}
    </button>
  );
}
