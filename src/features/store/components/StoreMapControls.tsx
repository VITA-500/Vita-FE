import { useState } from "react";
import { createPortal } from "react-dom";
import { Layers, LocateFixed, LocateOff, Minus, Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { RailTooltip, type RailTooltipProps } from "@/shared/ui/RailTooltip";

type StoreMapControlsProps = {
  hasUserLocation: boolean;
  isOtherStoresVisible: boolean;
  isUserLocationLoading: boolean;
  onFocusUserLocation?: () => void;
  onToggleOtherStores?: () => void;
  /** 확대("in")/축소("out") 버튼 */
  onZoom: (direction: "in" | "out") => void;
  otherStoreCount: number;
};

/** 지도 오른쪽 아래 컨트롤: 나머지 매장 보기, 내 위치, 확대/축소 */
export const StoreMapControls = ({
  hasUserLocation,
  isOtherStoresVisible,
  isUserLocationLoading,
  onFocusUserLocation,
  onToggleOtherStores,
  onZoom,
  otherStoreCount,
}: StoreMapControlsProps) => {
  const [controlTooltip, setControlTooltip] = useState<RailTooltipProps | null>(
    null,
  );
  const otherStoresToggleLabel = isOtherStoresVisible
    ? "나머지 매장 위치 숨기기"
    : `나머지 매장 ${otherStoreCount}곳 위치 보기`;
  /** 지도 컨트롤 툴팁: 공용 RailTooltip을 버튼 왼쪽(화면 오른쪽 끝이라)에 띄운다. */
  const showControlTooltip = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();

    setControlTooltip({
      label: otherStoresToggleLabel,
      placement: "left",
      x: rect.left - 8,
      y: rect.top + rect.height / 2,
    });
  };
  // 켜고 끌 때 툴팁 문구도 바로 바꾼다.
  const visibleControlTooltip = controlTooltip
    ? { ...controlTooltip, label: otherStoresToggleLabel }
    : null;

  return (
    <div className="pointer-events-none absolute right-4 bottom-6 z-30 flex flex-col items-end gap-1 md:right-6 md:bottom-8">
      {/* 나머지 매장 보기: 내 위치 버튼 묶음 바로 위(4px 간격) */}
      {onToggleOtherStores && otherStoreCount > 0 && (
        <div className="pointer-events-auto rounded-sm border border-gray-200 bg-white p-1 shadow-md shadow-gray-950/10 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/30">
          <button
            type="button"
            onClick={onToggleOtherStores}
            aria-pressed={isOtherStoresVisible}
            aria-label={otherStoresToggleLabel}
            onMouseEnter={(event) => showControlTooltip(event.currentTarget)}
            onMouseLeave={() => setControlTooltip(null)}
            onFocus={(event) => showControlTooltip(event.currentTarget)}
            onBlur={() => setControlTooltip(null)}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-sm transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none",
              isOtherStoresVisible
                ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand"
                : "hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand text-gray-700 dark:text-gray-200",
            )}
          >
            <Layers size={18} />
            <span className="bg-brand absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] leading-none font-black text-white">
              {otherStoreCount}
            </span>
          </button>
          {/* 다른 화면 툴팁과 같은 공용 RailTooltip. 지도 패널 안 transform·overflow에 갇히지 않게 body로 띄운다. */}
          {visibleControlTooltip &&
            createPortal(
              <RailTooltip {...visibleControlTooltip} />,
              document.body,
            )}
        </div>
      )}
      <div className="pointer-events-auto flex flex-col gap-1 rounded-sm border border-gray-200 bg-white p-1 shadow-md shadow-gray-950/10 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/30">
        {onFocusUserLocation && (
          <>
            <button
              type="button"
              onClick={onFocusUserLocation}
              disabled={isUserLocationLoading}
              className="hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand flex h-10 w-10 items-center justify-center rounded-sm text-gray-700 transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 dark:text-gray-200"
              aria-label="내 위치로 이동"
            >
              {hasUserLocation ? (
                <LocateFixed size={18} className="text-brand" />
              ) : (
                <LocateOff size={18} />
              )}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onZoom("in")}
          className="hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand flex h-10 w-10 items-center justify-center rounded-sm text-gray-700 transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:text-gray-200"
          aria-label="지도 확대"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          onClick={() => onZoom("out")}
          className="hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand flex h-10 w-10 items-center justify-center rounded-sm text-gray-700 transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:text-gray-200"
          aria-label="지도 축소"
        >
          <Minus size={18} />
        </button>
      </div>
    </div>
  );
};
