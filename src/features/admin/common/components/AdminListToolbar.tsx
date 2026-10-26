import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type AdminListToolbarProps = {
  children: ReactNode;
  className?: string;
};

/** 관리자 목록의 검색·필터 영역을 동일한 표면과 간격으로 감싸는 공통 블록. */
export const AdminListToolbar = ({
  children,
  className,
}: AdminListToolbarProps) => (
  <div
    className={cn(
      "bg-surface-muted/35 mb-7 grid gap-3 rounded-2xl p-3 dark:bg-white/[0.03]",
      className,
    )}
  >
    {children}
  </div>
);
