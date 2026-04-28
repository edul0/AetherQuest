import React from "react";

type LayoutProps = {
  children?: React.ReactNode;
  className?: string;
};

export function PageLayout({ children, className = "" }: LayoutProps) {
  return <div className={`min-h-screen bg-gradient-to-b from-aq-bg via-aq-bg-sky to-aq-bg-deep ${className}`}>{children}</div>;
}

export function PageShell({ children, className = "" }: LayoutProps) {
  return <div className={`mx-auto w-full max-w-aq-shell px-gutter ${className}`}>{children}</div>;
}

export function PageHeader({ children, className = "" }: LayoutProps) {
  return <div className={`border-b border-aq py-8 md:py-12 ${className}`}>{children}</div>;
}

export function PageContent({ children, className = "" }: LayoutProps) {
  return <div className={`py-8 md:py-12 ${className}`}>{children}</div>;
}

export function Grid({ children, className = "", cols = 3 }: LayoutProps & { cols?: number }) {
  const colsMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
  };

  return <div className={`grid ${colsMap[cols] ?? colsMap[3]} gap-6 ${className}`}>{children}</div>;
}

export function Flex({ children, className = "", gap = "4" }: LayoutProps & { gap?: string }) {
  const gapMap: Record<string, string> = {
    "1": "gap-1",
    "2": "gap-2",
    "3": "gap-3",
    "4": "gap-4",
    "5": "gap-5",
    "6": "gap-6",
  };

  return <div className={`flex ${gapMap[gap] ?? "gap-4"} ${className}`}>{children}</div>;
}
