"use client";

import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
  icon?: ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate?: (href: string) => void;
  separator?: ReactNode;
}

export function Breadcrumb({
  items,
  onNavigate,
  separator = <ChevronRight size={16} />,
}: BreadcrumbProps) {
  return (
    <nav
      className="flex items-center gap-2 text-sm"
      role="navigation"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.href && !item.active && onNavigate ? (
              <button
                onClick={() => onNavigate(item.href!)}
                className="flex items-center gap-1 text-aq-accent hover:text-aq-accent/80 transition-colors"
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ) : (
              <span
                className={`flex items-center gap-1 ${
                  item.active
                    ? "font-semibold text-aq-text"
                    : "text-aq-text-muted"
                }`}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </span>
            )}

            {index < items.length - 1 && (
              <span className="text-aq-text-muted/60 flex-shrink-0">
                {separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
