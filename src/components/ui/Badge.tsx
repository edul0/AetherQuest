import React from "react";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info";

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
};

const variants = {
  default: "bg-aq-accent-soft text-aq-accent",
  success: "bg-aq-success bg-opacity-20 text-aq-success",
  danger: "bg-aq-danger bg-opacity-20 text-aq-danger",
  warning: "bg-aq-gold bg-opacity-20 text-aq-gold",
  info: "bg-aq-accent bg-opacity-20 text-aq-accent",
};

export function Badge({ variant = "default", className = "", children }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5
        rounded-full
        text-xs font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
