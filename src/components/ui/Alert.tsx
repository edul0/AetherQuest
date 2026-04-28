import React from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
};

const variants = {
  info: {
    icon: Info,
    bg: "bg-aq-accent-soft",
    border: "border-aq-accent",
    text: "text-aq-accent",
  },
  success: {
    icon: CheckCircle,
    bg: "bg-aq-success bg-opacity-20",
    border: "border-aq-success",
    text: "text-aq-success",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-aq-gold bg-opacity-20",
    border: "border-aq-gold",
    text: "text-aq-gold",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-aq-danger bg-opacity-20",
    border: "border-aq-danger",
    text: "text-aq-danger",
  },
};

export function Alert({
  variant = "info",
  title,
  description,
  children,
  onClose,
  className = "",
}: AlertProps) {
  const { icon: Icon, bg, border, text } = variants[variant];

  return (
    <div
      className={`
        px-4 py-4
        rounded-aq
        border ${border}
        ${bg}
        ${className}
      `}
    >
      <div className="flex gap-4">
        <Icon className={`${text} flex-shrink-0 mt-0.5`} size={20} />
        <div className="flex-1">
          {title && (
            <h3 className={`font-semibold ${text} mb-1`}>{title}</h3>
          )}
          {description && (
            <p className="text-aq-text-muted text-sm">{description}</p>
          )}
          {children}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-aq-text-muted hover:text-aq-text transition-colors flex-shrink-0"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
