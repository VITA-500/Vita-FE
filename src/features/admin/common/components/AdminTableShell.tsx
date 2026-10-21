import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/atoms/Card";

type AdminTableShellProps = {
  children: ReactNode;
  className?: string;
  pagination?: ReactNode;
  tableWrapperClassName?: string;
};

/** 관리자 목록 테이블의 카드·가로 스크롤·페이지네이션 레이아웃을 제공한다. */
export const AdminTableShell = ({
  children,
  className,
  pagination,
  tableWrapperClassName,
}: AdminTableShellProps) => (
  <Card padding="none" className={cn("overflow-hidden", className)}>
    <div className={cn("overflow-x-auto", tableWrapperClassName)}>
      {children}
    </div>
    {pagination && (
      <div className="border-border-soft flex items-center justify-center gap-1 border-t px-5 py-4 dark:border-white/10">
        {pagination}
      </div>
    )}
  </Card>
);
