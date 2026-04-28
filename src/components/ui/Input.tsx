import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helpText?: string;
};

export function Input({ label, error, icon, helpText, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label ? <label className="mb-2 block text-sm font-medium text-aq-title">{label}</label> : null}
      <div className="relative">
        {icon ? <div className="absolute left-3 top-1/2 -translate-y-1/2 text-aq-text-muted">{icon}</div> : null}
        <input
          className={`w-full min-h-[2.85rem] rounded-aq border border-aq bg-aq-surface-glass px-4 py-2.5 text-aq-title shadow-aq-soft backdrop-blur-aq transition-all duration-200 ease-aq-smooth placeholder-aq-text-subtle focus:border-aq-strong focus:bg-aq-surface focus:outline-none focus:ring-2 focus:ring-[rgba(142,218,230,0.22)] ${icon ? "pl-10" : ""} ${error ? "border-aq-danger focus:ring-[rgba(180,86,86,0.28)]" : ""} ${className}`}
          {...props}
        />
      </div>
      {error ? <p className="mt-1 text-sm text-aq-danger">{error}</p> : null}
      {helpText && !error ? <p className="mt-1 text-sm text-aq-text-subtle">{helpText}</p> : null}
    </div>
  );
}
