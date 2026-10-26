import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/atoms/Card";

type AdminTableShellProps = {
  children: ReactNode;
  className?: string;
  pagination?: ReactNode;
  paginationClassName?: string;
  tableWrapperClassName?: string;
};

/** 관리자 목록 테이블의 카드·가로 스크롤·페이지네이션 레이아웃을 제공한다. */
export const AdminTableShell = ({
  children,
  className,
  pagination,
  paginationClassName,
  tableWrapperClassName,
}: AdminTableShellProps) => (
  <Card
    padding="none"
    className={cn("border-border-soft overflow-hidden shadow-none", className)}
  >
    <div className={cn("overflow-x-auto", tableWrapperClassName)}>
      {children}
    </div>
    {pagination && (
      <div
        className={cn(
          "border-border-soft bg-surface-muted/30 flex items-center justify-center gap-1 border-t px-5 py-3 dark:border-white/10 dark:bg-white/[0.02]",
          paginationClassName,
        )}
      >
        {pagination}
      </div>
    )}
  </Card>
);
