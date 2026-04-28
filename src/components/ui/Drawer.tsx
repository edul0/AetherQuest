"use client";

import { X } from "lucide-react";
import { ReactNode, useCallback, useEffect, useRef } from "react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  position?: "left" | "right";
  size?: "sm" | "md" | "lg";
  overlay?: boolean;
}

const sizeClasses = {
  sm: "w-full sm:max-w-sm",
  md: "w-full sm:max-w-md lg:max-w-lg",
  lg: "w-full sm:max-w-2xl",
};

const positionClasses = {
  left: "left-0 right-auto",
  right: "right-0 left-auto",
};

const positionAnimationClasses = {
  left: {
    open: "translate-x-0",
    closed: "-translate-x-full",
  },
  right: {
    open: "translate-x-0",
    closed: "translate-x-full",
  },
};

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  position = "right",
  size = "md",
  overlay = true,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Close on outside click
  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const animClass = isOpen
    ? positionAnimationClasses[position].open
    : positionAnimationClasses[position].closed;

  return (
    <>
      {/* Overlay */}
      {overlay && (
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={handleOverlayClick}
          role="presentation"
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 bottom-0 z-50 ${positionClasses[position]} ${sizeClasses[size]} bg-aq-bg border-aq-strong transition-transform duration-300 ease-in-out transform ${animClass} ${
          position === "left" ? "border-r" : "border-l"
        }`}
      >
        {/* Header */}
        {(title || description) && (
          <div className="border-b border-aq-strong/30 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-aq-text">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-aq-text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-aq-text-muted hover:text-aq-text transition-colors"
                aria-label="Fechar"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto h-full flex flex-col">
          <div className="flex-1 px-6 py-4">{children}</div>
        </div>
      </div>
    </>
  );
}
