"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type Toast = {
  id: number;
  message: string;
};

const TOAST_EVENT_NAME = "vita-toast";
const TOAST_DURATION_MS = 2600;
const TOAST_ANIMATION_MS = 220;

export const showToast = (message: string) => {
  window.dispatchEvent(
    new CustomEvent<string>(TOAST_EVENT_NAME, {
      detail: message,
    }),
  );
};

export const ToastProvider = () => {
  const [toast, setToast] = useState<Toast | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const showFrameRef = useRef<number | undefined>(undefined);
  const hideTimeoutRef = useRef<number | undefined>(undefined);
  const removeTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const message =
        event instanceof CustomEvent && typeof event.detail === "string"
          ? event.detail
          : "";

      if (!message) {
        return;
      }

      window.cancelAnimationFrame(showFrameRef.current ?? 0);
      window.clearTimeout(hideTimeoutRef.current);
      window.clearTimeout(removeTimeoutRef.current);
      setToast({ id: Date.now(), message });
      setIsVisible(false);

      showFrameRef.current = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      hideTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);

        removeTimeoutRef.current = window.setTimeout(() => {
          setToast(null);
        }, TOAST_ANIMATION_MS);
      }, TOAST_DURATION_MS);
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToast);

    return () => {
      window.cancelAnimationFrame(showFrameRef.current ?? 0);
      window.clearTimeout(hideTimeoutRef.current);
      window.clearTimeout(removeTimeoutRef.current);
      window.removeEventListener(TOAST_EVENT_NAME, handleToast);
    };
  }, []);

  if (!toast) {
    return null;
  }

  return (
    <div
      key={toast.id}
      className={`fixed top-5 left-1/2 z-[1000] flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition-all duration-200 ease-out dark:border-white/10 dark:bg-zinc-950 dark:text-white ${
        isVisible
          ? "-translate-x-1/2 translate-y-0 opacity-100"
          : "-translate-x-1/2 -translate-y-2 opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="text-brand" size={18} />
      <span>{toast.message}</span>
    </div>
  );
};
