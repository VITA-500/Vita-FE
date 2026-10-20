import { useState } from "react";
import { createPortal } from "react-dom";
import { Layers, LocateFixed, LocateOff, Minus, Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import {
  RailTooltip,
  type RailTooltipProps,
} from "@/shared/ui/molecules/RailTooltip";

type StoreMapControlsProps = {
  hasUserLocation: boolean;
  /** 낮은 지도(채팅 답변 안)에서는 모서리에 붙이고 버튼을 조금 작게 한다. */
  isCompact?: boolean;
  isOtherStoresVisible: boolean;
  isUserLocationLoading: boolean;
  onFocusUserLocation?: () => void;
  onToggleOtherStores?: () => void;
  /** 확대("in")/축소("out") 버튼 */
  onZoom: (direction: "in" | "out") => void;
  otherStoreCount: number;
};

/** 지도 오른쪽 아래 컨트롤: 나머지 매장 보기, 내 위치, 확대/축소(모바일은 두 손가락으로 확대/축소하므로 버튼을 숨긴다) */
export const StoreMapControls = ({
  hasUserLocation,
  isCompact = false,
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

  const otherStoresToggle =
    onToggleOtherStores && otherStoreCount > 0 ? (
      <div className="pointer-events-auto rounded-sm border border-gray-200 bg-white p-0.5 shadow-md shadow-gray-950/10 md:p-1 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/30">
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
            "relative flex h-8 w-8 items-center justify-center rounded-sm transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none md:h-10 md:w-10",
            isOtherStoresVisible
              ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand"
              : "hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand text-gray-700 dark:text-gray-200",
          )}
        >
          <Layers size={18} className="size-4 md:size-[18px]" />
          <span className="bg-brand absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] leading-none font-black text-white">
            {otherStoreCount}
          </span>
        </button>
      </div>
    ) : null;

  return (
    <>
      {/* 다른 화면 툴팁과 같은 공용 RailTooltip. 지도 패널 안 transform·overflow에 갇히지 않게 body로 띄운다. */}
      {visibleControlTooltip &&
        createPortal(<RailTooltip {...visibleControlTooltip} />, document.body)}
      {/* 모바일 전체 화면 지도: 나머지 매장 보기는 위쪽 검색창 아래 오른쪽에 둔다.
        바텀 시트를 끝까지 펼치면(검색창 아래까지) 그 뒤로 가려진다. */}
      {otherStoresToggle && !isCompact && (
        <div className="pointer-events-none absolute top-[64px] right-3 z-30 md:hidden">
          {otherStoresToggle}
        </div>
      )}
      <div
        className={cn(
          "pointer-events-none absolute z-30 flex flex-col items-end gap-1",
          isCompact
            ? "right-3 bottom-3 [&_button]:h-8 [&_button]:w-8"
            : // 모바일은 바텀 시트를 따라 올라가지 않고 제자리에 둔다(시트가 올라오면 그 뒤로 가려진다).
              "right-4 bottom-6 md:right-6 md:bottom-8",
        )}
      >
        {/* 나머지 매장 보기: 내 위치 버튼 묶음 바로 위(4px 간격). 모바일 전체 화면 지도에서는 위쪽으로 옮긴다(아래). */}
        {otherStoresToggle && (
          <div className={cn(!isCompact && "hidden md:block")}>
            {otherStoresToggle}
          </div>
        )}
        <div className="pointer-events-auto flex flex-col gap-1 rounded-sm border border-gray-200 bg-white p-0.5 shadow-md shadow-gray-950/10 md:p-1 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/30">
          {onFocusUserLocation && (
            <>
              <button
                type="button"
                onClick={onFocusUserLocation}
                disabled={isUserLocationLoading}
                className="hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand flex h-8 w-8 items-center justify-center rounded-sm text-gray-700 transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60 md:h-10 md:w-10 dark:text-gray-200"
                aria-label="내 위치로 이동"
              >
                {hasUserLocation ? (
                  <LocateFixed
                    size={18}
                    className="text-brand size-4 md:size-[18px]"
                  />
                ) : (
                  <LocateOff size={18} className="size-4 md:size-[18px]" />
                )}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => onZoom("in")}
            className="hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand hidden h-10 w-10 items-center justify-center rounded-sm text-gray-700 transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none md:flex dark:text-gray-200"
            aria-label="지도 확대"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={() => onZoom("out")}
            className="hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand hidden h-10 w-10 items-center justify-center rounded-sm text-gray-700 transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none md:flex dark:text-gray-200"
            aria-label="지도 축소"
          >
            <Minus size={18} />
          </button>
        </div>
      </div>
    </>
  );
};
