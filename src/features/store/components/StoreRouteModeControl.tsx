import { Bike, Bus, Car, SportShoe } from "lucide-react";
import type { StoreRouteMode } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

const routeModeButtonClassName =
  "group relative flex h-8 w-8 items-center justify-center rounded-sm transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none";
const routeModeTooltipClassName =
  "pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1 items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white opacity-0 shadow-xl transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100";

const routeModeOptions: {
  icon: typeof SportShoe | typeof Car | typeof Bike | typeof Bus;
  label: string;
  value: StoreRouteMode;
}[] = [
  { icon: SportShoe, label: "도보", value: "walk" },
  { icon: Car, label: "자동차", value: "car" },
  { icon: Bike, label: "자전거", value: "bicycle" },
  { icon: Bus, label: "대중교통", value: "transit" },
];

/** 길찾기 카드 상단의 이동수단(도보·자동차·자전거·대중교통) 선택 버튼 */
export const StoreRouteModeControl = ({
  onRouteModeChange,
  routeResultMessage,
  selectedRouteMode,
}: {
  onRouteModeChange: (mode: StoreRouteMode) => void;
  routeResultMessage?: string | null;
  selectedRouteMode: StoreRouteMode;
}) => (
  <div className="ml-3 flex shrink-0 gap-1 rounded-sm border border-gray-200 bg-white p-1 text-[11px] font-extrabold shadow-md shadow-gray-950/10 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/30">
    {routeModeOptions.map((option) => {
      const Icon = option.icon;
      const isSelected = selectedRouteMode === option.value;
      const isUnavailable = Boolean(routeResultMessage && isSelected);

      return (
        <button
          key={option.value}
          type="button"
          disabled={isUnavailable}
          onClick={() => onRouteModeChange(option.value)}
          className={cn(
            routeModeButtonClassName,
            isUnavailable
              ? "cursor-not-allowed bg-gray-100 text-gray-300 opacity-70 shadow-none dark:bg-white/5 dark:text-gray-600"
              : isSelected
                ? "bg-brand text-white shadow-sm"
                : "text-text-secondary hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand",
          )}
          aria-label={`${option.label} 길찾기`}
          aria-pressed={isSelected}
        >
          <Icon size={13} />
          <span className={routeModeTooltipClassName}>{option.label}</span>
        </button>
      );
    })}
  </div>
);
