"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, ReactNode, useCallback, useRef, useState } from "react";

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  error?: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      placeholder = "Selecione uma opção",
      options,
      value,
      onChange,
      disabled = false,
      error,
      icon,
      size = "md",
      variant = "primary",
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = useCallback(
      (optionValue: string | number) => {
        onChange?.(optionValue);
        setIsOpen(false);
      },
      [onChange],
    );

    const handleClickOutside = useCallback((e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }, []);

    // Add/remove click outside listener
    if (typeof window !== "undefined") {
      const handler = handleClickOutside;
      if (isOpen) {
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
      }
    }

    const sizeClasses = {
      sm: "py-1.5 px-3 text-sm",
      md: "py-2 px-3 text-base",
      lg: "py-3 px-4 text-lg",
    };

    const buttonBase =
      variant === "primary"
        ? "aq-input-base border border-aq-strong bg-aq-bg hover:border-aq-accent"
        : "border border-aq-strong bg-aq-bg-secondary hover:bg-aq-bg hover:border-aq-accent";

    return (
      <div ref={ref} className="w-full">
        {label && (
          <label className="block text-sm font-medium text-aq-text mb-2">
            {label}
          </label>
        )}

        <div ref={containerRef} className="relative">
          {/* Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full flex items-center justify-between gap-2 rounded-lg transition-all ${sizeClasses[size]} ${buttonBase} ${
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            } ${isOpen ? "border-aq-accent" : ""}`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {icon && <div className="flex-shrink-0 text-aq-accent">{icon}</div>}
              <span
                className={`truncate ${
                  selectedOption
                    ? "text-aq-text font-medium"
                    : "text-aq-text-muted italic"
                }`}
              >
                {selectedOption?.label || placeholder}
              </span>
            </div>
            <ChevronDown
              size={18}
              className={`flex-shrink-0 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute z-50 top-full mt-1 w-full bg-aq-bg border border-aq-strong rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {options.length === 0 ? (
                  <div className="py-3 px-4 text-sm text-aq-text-muted italic text-center">
                    Nenhuma opção disponível
                  </div>
                ) : (
                  options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        !option.disabled && handleSelect(option.value)
                      }
                      disabled={option.disabled}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors ${
                        option.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-aq-accent-soft cursor-pointer"
                      } ${
                        value === option.value
                          ? "bg-aq-accent text-aq-bg font-medium"
                          : "text-aq-text"
                      }`}
                    >
                      {option.icon && (
                        <div className="flex-shrink-0">{option.icon}</div>
                      )}
                      <span className="truncate">{option.label}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-sm text-aq-danger">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
