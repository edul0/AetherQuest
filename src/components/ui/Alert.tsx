import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

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
    bg: "bg-[rgba(110,198,217,0.12)]",
    border: "border-[rgba(110,198,217,0.28)]",
    text: "text-aq-accent",
  },
  success: {
    icon: CheckCircle,
    bg: "bg-[rgba(111,175,138,0.14)]",
    border: "border-[rgba(111,175,138,0.28)]",
    text: "text-aq-success",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-[rgba(215,180,106,0.12)]",
    border: "border-[rgba(215,180,106,0.28)]",
    text: "text-aq-gold",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-[rgba(180,86,86,0.12)]",
    border: "border-[rgba(180,86,86,0.28)]",
    text: "text-aq-danger",
  },
} as const;

export function Alert({ variant = "info", title, description, children, onClose, className = "" }: AlertProps) {
  const { icon: Icon, bg, border, text } = variants[variant];

  return (
    <div className={`rounded-aq border px-4 py-4 ${border} ${bg} ${className}`}>
      <div className="flex gap-4">
        <Icon className={`${text} mt-0.5 flex-shrink-0`} size={20} />
        <div className="flex-1">
          {title ? <h3 className={`mb-1 font-semibold ${text}`}>{title}</h3> : null}
          {description ? <p className="text-sm text-aq-text-muted">{description}</p> : null}
          {children}
        </div>
        {onClose ? (
          <button onClick={onClose} className="flex-shrink-0 text-aq-text-muted transition-colors hover:text-aq-text">
            X
          </button>
        ) : null}
      </div>
    </div>
  );
}
