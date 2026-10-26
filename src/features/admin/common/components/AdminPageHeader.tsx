import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type AdminPageHeaderProps = {
  action?: ReactNode;
  children?: ReactNode;
  description: ReactNode;
  title: ReactNode;
  className?: string;
};

export const AdminPageHeader = ({
  action,
  children,
  className,
  description,
  title,
}: AdminPageHeaderProps) => (
  <div
    className={cn(
      "mb-7 flex min-h-16 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
      className,
    )}
  >
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-normal text-gray-950 dark:text-white">
        {title}
      </h1>
      <p className="text-text-secondary mt-2 text-sm leading-6 font-normal">
        {description}
      </p>
      {children}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
