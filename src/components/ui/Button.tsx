import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  children?: React.ReactNode;
};

const variants = {
  primary:
    "border border-transparent bg-aq-accent text-aq-bg-deep shadow-aq-soft hover:bg-aq-accent-strong hover:-translate-y-[1px]",
  secondary:
    "border border-aq-strong bg-aq-surface-glass text-aq-title backdrop-blur-aq hover:border-aq-accent hover:bg-aq-surface-soft hover:text-aq-accent",
  danger:
    "border border-red-300/15 bg-[rgba(180,86,86,0.14)] text-red-100 hover:bg-[rgba(180,86,86,0.2)]",
  success:
    "border border-emerald-300/15 bg-[rgba(111,175,138,0.18)] text-[#eef9f1] hover:bg-[rgba(111,175,138,0.26)]",
  ghost:
    "border border-transparent bg-transparent text-aq-text-muted hover:border-aq hover:bg-aq-surface-glass hover:text-aq-title",
} as const;

const sizes = {
  sm: "min-h-[2.1rem] px-3 py-1.5 text-[11px] tracking-[0.12em]",
  md: "min-h-[2.6rem] px-4 py-2 text-[12px] tracking-[0.14em]",
  lg: "min-h-[3rem] px-6 py-3 text-sm tracking-[0.16em]",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-aq font-semibold uppercase transition-all duration-200 ease-aq-smooth disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : null}
      {icon && !loading ? <span>{icon}</span> : null}
      {children}
    </button>
  );
}
