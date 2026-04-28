"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, ReactNode, useCallback, useEffect, useRef, useState } from "react";

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
      placeholder = "Selecione uma opcao",
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

    useEffect(() => {
      if (!isOpen) return;
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside, isOpen]);

    const sizeClasses = {
      sm: "min-h-[2.25rem] px-3 py-1.5 text-sm",
      md: "min-h-[2.85rem] px-3.5 py-2 text-sm",
      lg: "min-h-[3.15rem] px-4 py-3 text-base",
    } as const;

    const buttonBase =
      variant === "primary"
        ? "border border-aq bg-aq-surface-glass shadow-aq-soft backdrop-blur-aq hover:border-aq-strong hover:bg-aq-surface-soft"
        : "border border-aq bg-aq-panel shadow-aq-soft hover:border-aq-strong hover:bg-aq-surface-soft";

    return (
      <div ref={ref} className="w-full">
        {label ? <label className="mb-2 block text-sm font-medium text-aq-title">{label}</label> : null}

        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className={`flex w-full items-center justify-between gap-2 rounded-lg transition-all ${sizeClasses[size]} ${buttonBase} ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            } ${isOpen ? "border-aq-strong bg-aq-surface" : ""}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {icon ? <div className="flex-shrink-0 text-aq-accent">{icon}</div> : null}
              <span className={`truncate ${selectedOption ? "font-medium text-aq-title" : "italic text-aq-text-muted"}`}>
                {selectedOption?.label || placeholder}
              </span>
            </div>
            <ChevronDown size={18} className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {isOpen ? (
            <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-aq border border-aq bg-aq-panel shadow-aq-float backdrop-blur-aq">
              <div className="aq-scrollbar max-h-64 overflow-y-auto p-1.5">
                {options.length === 0 ? (
                  <div className="px-4 py-3 text-center text-sm italic text-aq-text-muted">Nenhuma opcao disponivel</div>
                ) : (
                  options.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={`flex w-full items-center gap-2 rounded-[12px] px-4 py-2.5 text-left transition-colors ${
                        option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-[rgba(142,218,230,0.12)]"
                      } ${value === option.value ? "bg-[rgba(142,218,230,0.16)] font-medium text-aq-title" : "text-aq-text"}`}
                    >
                      {option.icon ? <div className="flex-shrink-0">{option.icon}</div> : null}
                      <span className="truncate">{option.label}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-1 text-sm text-aq-danger">{error}</p> : null}
      </div>
    );
  },
);

Select.displayName = "Select";
