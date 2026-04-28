import React from "react";

type LayoutProps = {
  children?: React.ReactNode;
  className?: string;
};

export function PageLayout({ children, className = "" }: LayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-aq-bg via-aq-bg-sky to-aq-bg-deep ${className}`}>
      {children}
    </div>
  );
}

export function PageShell({ children, className = "" }: LayoutProps) {
  return (
    <div
      className={`
        mx-auto px-gutter
        max-w-aq-shell
        w-full
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function PageHeader({ children, className = "" }: LayoutProps) {
  return (
    <div
      className={`
        py-8 md:py-12
        border-b border-aq
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function PageContent({ children, className = "" }: LayoutProps) {
  return (
    <div className={`py-8 md:py-12 ${className}`}>
      {children}
    </div>
  );
}

export function Grid({ children, className = "", cols = 3 }: LayoutProps & { cols?: number }) {
  return (
    <div
      className={`
        grid grid-cols-1
        ${cols > 1 ? `md:grid-cols-2 lg:grid-cols-${cols}` : ""}
        gap-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function Flex({ children, className = "", gap = "4" }: LayoutProps & { gap?: string }) {
  return (
    <div className={`flex gap-${gap} ${className}`}>
      {children}
    </div>
  );
}
