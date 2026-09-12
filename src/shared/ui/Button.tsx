import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

const variantStyles = {
  primary:
    "bg-brand text-white shadow-sm shadow-brand/20 hover:bg-brand-hover",
  secondary:
    "border border-border bg-white text-gray-900 shadow-sm hover:bg-gray-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/10",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white",
} as const;

const sizeStyles = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-7 text-base",
} as const;

type ButtonVariant = keyof typeof variantStyles;
type ButtonSize = keyof typeof sizeStyles;

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const buttonClassName = ({
  className,
  variant = "primary",
  size = "md",
}: ButtonStyleProps & { className?: string }) =>
  cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps;

export const Button = ({
  className,
  type = "button",
  variant,
  size,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={buttonClassName({ className, variant, size })}
    {...props}
  />
);

type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleProps;

export const ButtonLink = ({
  className,
  variant,
  size,
  ...props
}: ButtonLinkProps) => (
  <Link
    className={buttonClassName({ className, variant, size })}
    {...props}
  />
);
