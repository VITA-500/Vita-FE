import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Card, type CardProps } from "@/shared/ui/Card";

export type StatCardProps = Omit<CardProps, "children"> & {
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
};

export const StatCard = ({
  className,
  helper,
  label,
  value,
  ...props
}: StatCardProps) => (
  <Card className={cn("min-h-[120px]", className)} {...props}>
    <p className="text-text-secondary text-sm font-bold">{label}</p>
    <p className="text-brand mt-4 text-3xl font-black">{value}</p>
    {helper && (
      <p className="mt-3 text-xs font-semibold text-gray-400">{helper}</p>
    )}
  </Card>
);
