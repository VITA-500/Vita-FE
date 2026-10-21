import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type IconButtonVariant = "ghost" | "surface" | "danger";
type IconButtonSize = "xs" | "sm" | "md";

const variantClassNames: Record<IconButtonVariant, string> = {
  ghost:
    "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white",
  surface:
    "bg-white text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-zinc-950 dark:text-gray-200 dark:hover:bg-white/10",
  danger:
    "text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300",
};

const sizeClassNames: Record<IconButtonSize, string> = {
  xs: "size-7",
  sm: "size-8",
  md: "size-10",
};

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  children: ReactNode;
};

/** 아이콘만 보여주는 버튼. 시각적 스타일보다 접근성 속성 전달을 우선한다. */
export const IconButton = ({
  children,
  className,
  size = "md",
  type = "button",
  variant = "ghost",
  ...props
}: IconButtonProps) => (
  <button
    type={type}
    className={cn(
      "focus-visible:ring-brand/40 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm transition outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
      sizeClassNames[size],
      variantClassNames[variant],
      className,
    )}
    {...props}
  >
    {children}
  </button>
);
