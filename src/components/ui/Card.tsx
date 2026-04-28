import React from "react";

type CardProps = {
  className?: string;
  children?: React.ReactNode;
  glass?: boolean;
  hover?: boolean;
};

export function Card({ className = "", children, glass = false, hover = false }: CardProps) {
  const glassClass = glass
    ? "border border-aq bg-aq-surface-glass/95 backdrop-blur-aq"
    : "border border-aq bg-aq-panel";
  const hoverClass = hover
    ? "transition-all duration-300 ease-aq-smooth hover:-translate-y-[1px] hover:border-aq-strong hover:shadow-aq-float"
    : "";

  return <div className={`rounded-aq-lg shadow-aq-soft ${glassClass} ${hoverClass} ${className}`}>{children}</div>;
}

export function CardHeader({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`border-b border-aq px-5 py-4 md:px-6 ${className}`}>{children}</div>;
}

export function CardContent({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`px-5 py-4 md:px-6 ${className}`}>{children}</div>;
}

export function CardFooter({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`border-t border-aq px-5 py-4 md:px-6 ${className}`}>{children}</div>;
}
