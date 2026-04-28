import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helpText?: string;
};

export function Input({
  label,
  error,
  icon,
  helpText,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-aq-title mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-aq-text-muted">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full
            px-4 py-2
            ${icon ? "pl-10" : ""}
            rounded-aq
            bg-aq-surface
            border border-aq
            text-aq-title
            placeholder-aq-text-subtle
            transition-all duration-200
            focus:outline-none
            focus:border-aq-accent
            focus:ring-2
            focus:ring-aq-accent
            focus:ring-opacity-20
            ${error ? "border-aq-danger focus:ring-aq-danger focus:ring-opacity-30" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-sm text-aq-danger mt-1">{error}</p>}
      {helpText && !error && <p className="text-sm text-aq-text-subtle mt-1">{helpText}</p>}
    </div>
  );
}
