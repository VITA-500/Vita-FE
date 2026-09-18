"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/Card";

type ModalSize = "sm" | "md" | "lg";

const sizeStyles = {
  sm: "max-w-[360px]",
  md: "max-w-[460px]",
  lg: "max-w-[620px]",
} as const;

export type ModalProps = {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  title: ReactNode;
};

export const Modal = ({
  actions,
  children,
  className,
  description,
  isOpen,
  onClose,
  size = "md",
  title,
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-gray-950/45 backdrop-blur-sm"
        aria-label="모달 닫기"
        onClick={onClose}
      />

      <Card
        role="dialog"
        aria-modal="true"
        padding="lg"
        style={{ boxShadow: "0 24px 80px rgba(25,31,40,0.18)" }}
        className={cn("relative z-10 w-full", sizeStyles[size], className)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-950 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-text-secondary mt-2 text-sm leading-6 font-medium">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            className="hover:bg-surface-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition outline-none hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-gray-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/20"
            aria-label="모달 닫기"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        {children && (
          <div className="text-text-primary mt-5 text-sm leading-6">
            {children}
          </div>
        )}

        {actions && (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {actions}
          </div>
        )}
      </Card>
    </div>
  );
};
