"use client";

import { ReactNode } from "react";

export interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  description?: string;
  variant?: "primary" | "secondary" | "success" | "danger";
  trend?: {
    direction: "up" | "down";
    value: string;
  };
  onClick?: () => void;
  className?: string;
}

const variantClasses = {
  primary: "border-aq-accent/30 bg-aq-accent/5 hover:bg-aq-accent/10",
  secondary: "border-aq-strong/30 bg-aq-bg-secondary/50 hover:bg-aq-strong/10",
  success: "border-aq-success/30 bg-aq-success/5 hover:bg-aq-success/10",
  danger: "border-aq-danger/30 bg-aq-danger/5 hover:bg-aq-danger/10",
};

export function StatCard({
  icon,
  label,
  value,
  description,
  variant = "primary",
  trend,
  onClick,
  className = "",
}: StatCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        group w-full rounded-lg border p-4 text-left
        transition-all duration-200
        ${variantClasses[variant]}
        ${isClickable ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5" : "cursor-default"}
        ${className}
      `}
    >
      {/* Header with icon and label */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-aq-text-muted">
            {label}
          </h3>
        </div>
        {icon && (
          <div className="flex-shrink-0 text-aq-accent opacity-70 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-aq-text">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.direction === "up"
                ? "text-aq-success"
                : "text-aq-danger"
            }`}
          >
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="mt-2 text-xs text-aq-text-muted leading-relaxed">
          {description}
        </p>
      )}
    </button>
  );
}

/**
 * Grid container for stat cards
 */
export function StatGrid({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}) {
  const colsMap = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid gap-4 ${colsMap[columns]}`}>
      {children}
    </div>
  );
}
