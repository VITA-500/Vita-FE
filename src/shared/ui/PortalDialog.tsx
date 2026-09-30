"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";

type PortalDialogProps = {
  children: ReactNode;
  className?: string;
  labelledBy: string;
  maxWidthClassName?: string;
  onClose: () => void;
};

export const PortalDialog = ({
  children,
  className,
  labelledBy,
  maxWidthClassName = "max-w-[360px]",
  onClose,
}: PortalDialogProps) => {
  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-950/35 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "w-full rounded-3xl bg-white p-5 text-center shadow-2xl dark:bg-zinc-950",
          maxWidthClassName,
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};
