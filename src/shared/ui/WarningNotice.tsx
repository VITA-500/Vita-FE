import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type WarningNoticeProps = {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
};

/**
 * 위약금, 해지 시 유의사항처럼 "놓치면 안 되는 주의사항"을 강조할 때 씁니다.
 * 추천을 뜻하는 brand 색과 헷갈리지 않도록 별도의 amber 톤을 씁니다.
 */
export const WarningNotice = ({
  children,
  className,
  title,
}: WarningNoticeProps) => (
  <div
    role="note"
    className={cn(
      "flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10",
      className,
    )}
  >
    <TriangleAlert
      size={18}
      className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300"
    />

    <div className="min-w-0 text-sm leading-6">
      {title && (
        <p className="font-extrabold text-amber-800 dark:text-amber-200">
          {title}
        </p>
      )}
      <div
        className={cn(
          "text-amber-700 dark:text-amber-300/90",
          Boolean(title) && "mt-1",
        )}
      >
        {children}
      </div>
    </div>
  </div>
);
