"use client";

import { Loader2 } from "lucide-react";

export interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullscreen?: boolean;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
};

export function Loading({
  message = "Carregando...",
  size = "md",
  fullscreen = false,
}: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2
        size={sizeMap[size]}
        className="text-aq-accent animate-spin"
      />
      {message && (
        <p className="text-sm font-medium text-aq-text-muted">
          {message}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-aq-bg/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {content}
    </div>
  );
}

/**
 * Skeleton loading for data placeholders
 */
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-aq-strong/30 bg-aq-bg-secondary/50 p-4 animate-pulse">
      <div className="h-4 bg-aq-strong/20 rounded w-3/4 mb-3" />
      <div className="h-3 bg-aq-strong/20 rounded w-full mb-2" />
      <div className="h-3 bg-aq-strong/20 rounded w-5/6" />
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
