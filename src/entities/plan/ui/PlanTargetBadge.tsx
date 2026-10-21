import type { PlanTargetGroup } from "@/entities/plan/model/types";
import { cn } from "@/shared/lib/cn";

export const planTargetGroupLabels: Record<PlanTargetGroup, string> = {
  GENERAL: "일반",
  TEEN: "청소년",
  YOUTH: "청년",
  SENIOR: "시니어",
  KIDS: "키즈",
  TABLET: "태블릿",
  WATCH: "워치",
};

export const PlanTargetBadge = ({
  targetGroup,
}: {
  targetGroup: PlanTargetGroup;
}) => (
  <span
    className={cn(
      "inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold",
      colors[targetGroup],
    )}
  >
    {planTargetGroupLabels[targetGroup]}
  </span>
);

const colors: Record<PlanTargetGroup, string> = {
  GENERAL:
    "bg-slate-100 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300",
  TEEN: "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
  YOUTH: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
  SENIOR: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  KIDS: "bg-pink-50 text-pink-700 dark:bg-pink-400/10 dark:text-pink-300",
  TABLET: "bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300",
  WATCH:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
};
