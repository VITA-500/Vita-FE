import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/Card";

export type InfoRow = {
  label: ReactNode;
  value: ReactNode;
};

export type InfoTableProps = {
  className?: string;
  rows: readonly InfoRow[];
  title?: ReactNode;
};

/**
 * 번호이동 조건, 결합할인 조건처럼 "항목 : 값" 형태로 정리되는 정보에 씁니다.
 * 좁은 채팅 말풍선 폭에서도 줄바꿈 없이 읽히도록 표(table) 대신 정의 목록(dl)으로 만들었습니다.
 */
export const InfoTable = ({ className, rows, title }: InfoTableProps) => (
  <Card padding="none" className={cn("w-full overflow-hidden", className)}>
    {title && (
      <div className="border-border-soft border-b px-5 py-3 dark:border-white/10">
        <p className="text-sm font-extrabold text-gray-950 dark:text-white">
          {title}
        </p>
      </div>
    )}

    <dl className="divide-border-soft divide-y dark:divide-white/10">
      {rows.map((row, index) => (
        <div
          key={index}
          className="flex items-start justify-between gap-4 px-5 py-3 text-sm"
        >
          <dt className="text-text-secondary shrink-0 font-semibold">
            {row.label}
          </dt>
          <dd className="text-text-primary text-right font-bold">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  </Card>
);
