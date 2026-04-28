import React from "react";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info";

type BadgeProps = {
  variant?: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
};

const variants = {
  default: "border border-[rgba(142,218,230,0.18)] bg-[rgba(142,218,230,0.12)] text-aq-accent",
  success: "border border-[rgba(111,175,138,0.18)] bg-[rgba(111,175,138,0.14)] text-aq-success",
  danger: "border border-[rgba(180,86,86,0.18)] bg-[rgba(180,86,86,0.14)] text-aq-danger",
  warning: "border border-[rgba(215,180,106,0.18)] bg-[rgba(215,180,106,0.12)] text-aq-gold",
  info: "border border-[rgba(142,218,230,0.18)] bg-[rgba(142,218,230,0.1)] text-aq-accent",
} as const;

export function Badge({ variant = "default", className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
