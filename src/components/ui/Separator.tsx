"use client";

export interface SeparatorProps {
  className?: string;
  decorative?: boolean;
  orientation?: "horizontal" | "vertical";
}

export function Separator({
  className = "",
  decorative = false,
  orientation = "horizontal",
}: SeparatorProps) {
  if (orientation === "vertical") {
    return (
      <div
        role={decorative ? "none" : "separator"}
        aria-orientation="vertical"
        className={`bg-aq-strong opacity-20 w-px ${className}`}
      />
    );
  }

  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation="horizontal"
      className={`bg-aq-strong opacity-20 h-px w-full ${className}`}
    />
  );
}
