"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type ThemeToggleButtonProps = {
  className?: string;
  iconSize?: number;
  onToggleComplete?: () => void;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
};

const subscribeToClient = () => () => {};

export const ThemeToggleButton = ({
  className,
  iconSize = 20,
  onMouseEnter,
  onMouseLeave,
  onToggleComplete,
}: ThemeToggleButtonProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
  const isDark = resolvedTheme === "dark";

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
    onToggleComplete?.();
  };

  return (
    <button
      type="button"
      onClick={handleToggleTheme}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 shadow-sm transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 dark:border-white/10 dark:bg-black dark:text-white dark:hover:bg-white/10",
        className,
      )}
      aria-label={isDark ? "라이트 모드로 변경" : "다크 모드로 변경"}
    >
      {isMounted && isDark ? (
        <Moon size={iconSize} />
      ) : (
        <Sun size={iconSize} />
      )}
    </button>
  );
};
