import { cn } from "@/shared/lib/cn";

type StoreOpenStatusBadgeProps = {
  className?: string;
  /** BE openNow(조회 시점 기준). 값이 없으면 뱃지를 그리지 않는다. */
  openNow?: boolean;
};

/** 매장 목록·정보 카드·채팅 카드에 붙는 "영업 중 / 영업 종료" 뱃지 */
export const StoreOpenStatusBadge = ({
  className,
  openNow,
}: StoreOpenStatusBadgeProps) => {
  if (openNow === undefined) return null;

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold",
        openNow
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"
          : "bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500",
        className,
      )}
    >
      {openNow ? "영업 중" : "영업 종료"}
    </span>
  );
};
