import React from "react";

type CardProps = {
  className?: string;
  children?: React.ReactNode;
  glass?: boolean;
  hover?: boolean;
};

export function Card({ className = "", children, glass = false, hover = false }: CardProps) {
  const glassClass = glass ? "bg-aq-surface-glass backdrop-blur-aq border border-aq" : "bg-aq-panel border border-aq";
  const hoverClass = hover ? "hover:border-aq-strong transition-all duration-300 hover:shadow-aq-soft" : "";

  return (
    <div
      className={`
        rounded-aq
        shadow-aq-soft
        ${glassClass}
        ${hoverClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`px-6 py-4 border-b border-aq ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`px-6 py-4 border-t border-aq ${className}`}>
      {children}
    </div>
  );
}
