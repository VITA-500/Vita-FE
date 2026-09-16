import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

const cardVariantStyles = {
  default:
    "border-border bg-surface text-text-primary shadow-sm dark:border-white/10",
  muted:
    "border-border-soft bg-surface-muted text-text-primary dark:border-white/10",
  warm: "border-brand/20 bg-brand-soft text-text-primary dark:border-brand/20 dark:bg-brand/10",
  accent:
    "border-brand bg-surface text-text-primary shadow-sm shadow-brand/10 dark:border-brand/70",
} as const;

const cardPaddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

export type CardVariant = keyof typeof cardVariantStyles;
export type CardPadding = keyof typeof cardPaddingStyles;

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
};

export const Card = ({
  className,
  padding = "md",
  variant = "default",
  ...props
}: CardProps) => (
  <div
    className={cn(
      "rounded-2xl border transition-colors",
      cardVariantStyles[variant],
      cardPaddingStyles[padding],
      className,
    )}
    {...props}
  />
);

export type CardHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export const CardHeader = ({
  action,
  children,
  className,
  description,
  title,
  ...props
}: CardHeaderProps) => (
  <div
    className={cn(
      "border-border-soft flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between dark:border-white/10",
      className,
    )}
    {...props}
  >
    <div className="min-w-0">
      {title && (
        <h3 className="text-base font-extrabold text-gray-950 dark:text-white">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-text-secondary mt-1 text-sm leading-6">
          {description}
        </p>
      )}
      {children}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export const CardContent = ({ className, ...props }: CardContentProps) => (
  <div className={cn("pt-4", className)} {...props} />
);

export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export const CardFooter = ({ className, ...props }: CardFooterProps) => (
  <div
    className={cn(
      "border-border-soft mt-5 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end dark:border-white/10",
      className,
    )}
    {...props}
  />
);
