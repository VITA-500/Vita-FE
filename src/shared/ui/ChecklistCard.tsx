import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/Card";

export type ChecklistItem = {
  label: ReactNode;
  /** true: 충족/완료, false: 미충족, undefined: 그냥 준비물 목록 */
  met?: boolean;
};

export type ChecklistCardProps = {
  className?: string;
  description?: ReactNode;
  items: readonly ChecklistItem[];
  title?: ReactNode;
};

/**
 * 준비물(신분증, 서류)이나 자격 조건(가족 2인 이상 등)처럼
 * "항목을 나열해서 확인시켜야 하는" 정보에 씁니다.
 */
export const ChecklistCard = ({
  className,
  description,
  items,
  title,
}: ChecklistCardProps) => (
  <Card padding="md" className={cn("w-full", className)}>
    {(title || description) && (
      <div className="mb-3">
        {title && (
          <p className="text-sm font-extrabold text-gray-950 dark:text-white">
            {title}
          </p>
        )}
        {description && (
          <p className="text-text-secondary mt-1 text-xs leading-5">
            {description}
          </p>
        )}
      </div>
    )}

    <ul className="space-y-2">
      {items.map((item, index) => {
        const Icon = item.met === false ? X : Check;

        return (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                item.met === false
                  ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300"
                  : "bg-brand-soft text-brand dark:bg-brand/15",
              )}
            >
              <Icon size={11} strokeWidth={3} />
            </span>
            <span
              className={cn(
                "text-text-primary font-medium",
                item.met === false && "text-text-secondary line-through",
              )}
            >
              {item.label}
            </span>
          </li>
        );
      })}
    </ul>
  </Card>
);
