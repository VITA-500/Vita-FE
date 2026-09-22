import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type AdminEmptyStateProps = {
  className?: string;
  description?: ReactNode;
  title: ReactNode;
};

export const AdminEmptyState = ({
  className,
  description,
  title,
}: AdminEmptyStateProps) => (
  <div
    className={cn(
      "flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center",
      className,
    )}
  >
    <p className="text-sm font-extrabold text-gray-700 dark:text-gray-200">
      {title}
    </p>
    {description && (
      <p className="text-text-secondary mt-2 text-xs leading-5 font-semibold">
        {description}
      </p>
    )}
  </div>
);
