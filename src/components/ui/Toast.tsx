"use client";

import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { ReactNode, useCallback, useState } from "react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // ms, 0 = permanent
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const toastIcons: Record<ToastType, ReactNode> = {
  info: <Info size={20} />,
  success: <CheckCircle size={20} />,
  warning: <AlertCircle size={20} />,
  error: <XCircle size={20} />,
};

const toastColors: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  info: {
    bg: "bg-aq-info/10",
    border: "border-aq-info/30",
    text: "text-aq-text",
    icon: "text-aq-info",
  },
  success: {
    bg: "bg-aq-success/10",
    border: "border-aq-success/30",
    text: "text-aq-text",
    icon: "text-aq-success",
  },
  warning: {
    bg: "bg-aq-warning/10",
    border: "border-aq-warning/30",
    text: "text-aq-text",
    icon: "text-aq-warning",
  },
  error: {
    bg: "bg-aq-danger/10",
    border: "border-aq-danger/30",
    text: "text-aq-text",
    icon: "text-aq-danger",
  },
};

function ToastItem({ toast, onClose }: ToastItemProps) {
  const colors = toastColors[toast.type];
  const icon = toastIcons[toast.type];

  return (
    <div
      className={`${colors.bg} border ${colors.border} rounded-lg p-4 flex items-start gap-3 ${colors.text} animate-slide-up`}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${colors.icon} mt-0.5`}>{icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="font-semibold mb-1">{toast.title}</h4>}
        <p className="text-sm opacity-90 break-words">{toast.message}</p>

        {/* Action Button */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onClose(toast.id);
            }}
            className="text-sm font-medium mt-2 hover:underline opacity-80 hover:opacity-100 transition-opacity"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 hover:opacity-100 opacity-60 transition-opacity"
        aria-label="Fechar notificação"
      >
        <X size={18} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[999] flex flex-col gap-3 pointer-events-none"
      role="region"
      aria-label="Notificações"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={onRemove} />
        </div>
      ))}
    </div>
  );
}

/**
 * Hook para usar toast notifications
 * @example
 * const { addToast } = useToast();
 * addToast({
 *   type: 'success',
 *   title: 'Sucesso',
 *   message: 'Operação realizada com sucesso',
 *   duration: 5000,
 * });
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      };

      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration > 0) {
        const timeout = setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, newToast.duration);

        return () => clearTimeout(timeout);
      }

      return () => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      };
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
  };
}

// Convenience methods
export function useToastShortcuts() {
  const { addToast } = useToast();

  return {
    success: (message: string, title?: string) =>
      addToast({ type: "success", message, title }),
    error: (message: string, title?: string) =>
      addToast({ type: "error", message, title }),
    info: (message: string, title?: string) =>
      addToast({ type: "info", message, title }),
    warning: (message: string, title?: string) =>
      addToast({ type: "warning", message, title }),
  };
}
