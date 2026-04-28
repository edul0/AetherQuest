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
  primary: "border-[rgba(142,218,230,0.24)] bg-[rgba(142,218,230,0.08)] hover:bg-[rgba(142,218,230,0.12)]",
  secondary: "border-[rgba(143,168,181,0.18)] bg-[rgba(234,244,246,0.05)] hover:bg-[rgba(234,244,246,0.08)]",
  success: "border-[rgba(111,175,138,0.22)] bg-[rgba(111,175,138,0.09)] hover:bg-[rgba(111,175,138,0.13)]",
  danger: "border-[rgba(180,86,86,0.22)] bg-[rgba(180,86,86,0.09)] hover:bg-[rgba(180,86,86,0.13)]",
} as const;

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
      className={`group w-full rounded-aq border p-4 text-left shadow-aq-soft transition-all duration-200 ease-aq-smooth ${variantClasses[variant]} ${
        isClickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg" : "cursor-default"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-aq-text-muted">{label}</h3>
        </div>
        {icon ? <div className="flex-shrink-0 text-aq-accent opacity-70 transition-opacity group-hover:opacity-100">{icon}</div> : null}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-aq-text">{value}</span>
        {trend ? (
          <span className={`text-xs font-semibold ${trend.direction === "up" ? "text-aq-success" : "text-aq-danger"}`}>
            {trend.direction === "up" ? "+" : "-"} {trend.value}
          </span>
        ) : null}
      </div>

      {description ? <p className="mt-2 text-xs leading-relaxed text-aq-text-muted">{description}</p> : null}
    </button>
  );
}

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
  } as const;

  return <div className={`grid gap-4 ${colsMap[columns]}`}>{children}</div>;
}
