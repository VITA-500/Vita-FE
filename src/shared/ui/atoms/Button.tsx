import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

const variantStyles = {
  primary:
    "bg-brand text-white shadow-sm shadow-brand/20 hover:bg-brand-hover focus-visible:ring-brand/30",
  secondary:
    "border border-border bg-white text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:ring-gray-300 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-white/20",
  outline:
    "border border-brand bg-white text-brand shadow-sm hover:bg-brand-soft focus-visible:ring-brand/30 dark:bg-zinc-950 dark:hover:bg-brand/10",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-950 focus-visible:ring-gray-300 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/20",
  danger:
    "bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 focus-visible:ring-red-300",
  dangerGhost:
    "bg-transparent text-red-400 shadow-none hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-300",
} as const;

const sizeStyles = {
  xs: "h-8 px-3 text-xs",
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-7 text-base",
} as const;

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export const buttonClassName = ({
  className,
  fullWidth = false,
  variant = "primary",
  size = "md",
}: ButtonStyleProps & { className?: string }) =>
  cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl font-bold whitespace-nowrap transition outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-zinc-950",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className,
  );

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleProps & {
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
  };

export const Button = ({
  children,
  className,
  disabled,
  fullWidth,
  isLoading = false,
  leftIcon,
  rightIcon,
  type = "button",
  variant,
  size,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={buttonClassName({ className, fullWidth, variant, size })}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading && (
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
    )}
    {!isLoading && leftIcon}
    {children}
    {!isLoading && rightIcon}
  </button>
);

export type ButtonLinkProps = ComponentProps<typeof Link> &
  ButtonStyleProps & {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
  };

export const ButtonLink = ({
  children,
  className,
  fullWidth,
  leftIcon,
  rightIcon,
  variant,
  size,
  ...props
}: ButtonLinkProps) => (
  <Link
    className={buttonClassName({ className, fullWidth, variant, size })}
    {...props}
  >
    {leftIcon}
    {children}
    {rightIcon}
  </Link>
);
