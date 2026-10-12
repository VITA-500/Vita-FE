import { cn } from "@/shared/lib/cn";
import { getCurrentOpenState } from "@/features/store/lib/storeOpenHours";

type StoreOpenStatusBadgeProps = {
  businessHours?: string;
  className?: string;
  /** BE openNow(조회 시점 기준). 값이 없으면 뱃지를 그리지 않는다. */
  openNow?: boolean;
};

const statusView = {
  before: {
    className: "bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300",
    label: "영업 전",
  },
  closed: {
    className: "bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500",
    label: "영업 종료",
  },
  open: {
    className:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300",
    label: "영업 중",
  },
} as const;

/** 매장 목록·정보 카드·채팅 카드에 붙는 "영업 전 / 영업 중 / 영업 종료" 뱃지 */
export const StoreOpenStatusBadge = ({
  businessHours,
  className,
  openNow,
}: StoreOpenStatusBadgeProps) => {
  const status = getCurrentOpenState({ businessHours, openNow });

  if (!status) return null;

  const view = statusView[status];

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold",
        view.className,
        className,
      )}
    >
      {view.label}
    </span>
  );
};
