import type { ReactNode } from "react";
import {
  CheckCircle2,
  CircleSlash2,
  PauseCircle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
export type AdminBadgeTone =
  "active" | "inactive" | "warning" | "neutral" | "admin";
const styles: Record<AdminBadgeTone, string> = {
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  inactive: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
  warning: "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
  neutral: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-gray-300",
  admin:
    "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
};
export const AdminStatusBadge = ({
  label,
  tone,
  icon,
}: {
  label: ReactNode;
  tone: AdminBadgeTone;
  icon?: AdminBadgeTone;
}) => {
  const Icon =
    icon === "active"
      ? CheckCircle2
      : icon === "inactive"
        ? CircleSlash2
        : icon === "warning"
          ? PauseCircle
          : icon === "admin"
            ? ShieldCheck
            : null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-5 font-bold",
        styles[tone],
      )}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {label}
    </span>
  );
};
