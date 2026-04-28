"use client";

import { ReactNode } from "react";

export interface FormGroupProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormGroup({
  label,
  error,
  hint,
  required = false,
  children,
  className = "",
}: FormGroupProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-aq-text">
          {label}
          {required && <span className="text-aq-danger ml-1">*</span>}
        </label>
      )}

      <div>{children}</div>

      {error && <p className="text-xs text-aq-danger font-medium">{error}</p>}
      {hint && !error && (
        <p className="text-xs text-aq-text-muted">{hint}</p>
      )}
    </div>
  );
}
