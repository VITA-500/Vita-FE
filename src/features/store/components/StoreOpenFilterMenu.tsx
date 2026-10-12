import { useEffect, useRef, useState } from "react";
import { Check, Clock3 } from "lucide-react";
import {
  ALL_STORE_OPEN_FILTER,
  getNextOpenFilterTime,
  getOpenFilterLabel,
  OPEN_FILTER_TIME_OPTIONS,
} from "@/features/store/lib/storeOpenHours";
import type { StoreOpenFilter } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

type StoreOpenFilterMenuProps = {
  onChange: (nextFilter: StoreOpenFilter) => void;
  openFilter: StoreOpenFilter;
};

const optionClassName =
  "flex h-9 w-full items-center justify-between gap-2 rounded-sm px-2.5 text-left text-xs font-bold transition hover:bg-gray-100 dark:hover:bg-white/10";

/** 검색창의 시계 버튼: 영업 시간 전체 / 지금 영업 중 / 선택한 시각에 영업 중 */
export const StoreOpenFilterMenu = ({
  onChange,
  openFilter,
}: StoreOpenFilterMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTimeListOpen, setIsTimeListOpen] = useState(
    openFilter.mode === "at",
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const isActive = openFilter.mode !== "all";
  const selectedTime =
    openFilter.mode === "at" ? openFilter.time : getNextOpenFilterTime();

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const select = (nextFilter: StoreOpenFilter) => {
    onChange(nextFilter);
    setIsOpen(false);
    setIsTimeListOpen(nextFilter.mode === "at");
  };

  return (
    <div
      ref={rootRef}
      className="group/open-filter relative shrink-0 self-center"
      onClick={(event) => {
        // 검색창 label 안에 있어, 메뉴 빈 곳을 눌러도 입력창 포커스(검색 기록 열림)로 번지지 않게 한다.
        event.stopPropagation();
        event.preventDefault();
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-sm transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none",
          isActive
            ? "bg-brand text-white"
            : "text-text-secondary hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand",
        )}
        aria-label={`영업 시간 필터: ${getOpenFilterLabel(openFilter)}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "store-open-filter-menu" : undefined}
      >
        <Clock3 size={14} />
      </button>
      <span className="pointer-events-none absolute top-[calc(100%+8px)] left-0 z-50 flex translate-y-1 items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white opacity-0 shadow-xl transition duration-150 group-focus-within/open-filter:translate-y-0 group-focus-within/open-filter:opacity-100 group-hover/open-filter:translate-y-0 group-hover/open-filter:opacity-100">
        {getOpenFilterLabel(openFilter)}
      </span>

      {isOpen && (
        <div
          id="store-open-filter-menu"
          role="group"
          aria-label="영업 시간 필터"
          className="border-border absolute top-[calc(100%+10px)] left-0 z-50 w-56 rounded-sm border bg-white p-1.5 text-gray-700 shadow-xl dark:border-white/10 dark:bg-zinc-950 dark:text-gray-200"
        >
          <button
            type="button"
            aria-pressed={openFilter.mode === "all"}
            className={optionClassName}
            onClick={() => select(ALL_STORE_OPEN_FILTER)}
          >
            영업 시간 전체
            {openFilter.mode === "all" && <Check size={14} />}
          </button>
          <button
            type="button"
            aria-pressed={openFilter.mode === "now"}
            className={optionClassName}
            onClick={() => select({ mode: "now" })}
          >
            지금 영업 중
            {openFilter.mode === "now" && (
              <Check size={14} className="text-brand" />
            )}
          </button>
          <div className="rounded-sm">
            <button
              type="button"
              aria-expanded={isTimeListOpen}
              className={optionClassName}
              onClick={() => setIsTimeListOpen((wasOpen) => !wasOpen)}
            >
              <span>이 시간에 영업 중</span>
              <span
                className={cn(
                  "rounded-sm px-2 py-1 text-[11px]",
                  openFilter.mode === "at"
                    ? "bg-brand-soft text-brand"
                    : "bg-gray-100 text-gray-500 dark:bg-white/10",
                )}
              >
                {selectedTime}
              </span>
            </button>
            {isTimeListOpen && (
              <div className="mt-1 grid max-h-44 grid-cols-2 gap-1 overflow-y-auto rounded-sm bg-gray-50 p-1 dark:bg-white/[0.04]">
                {OPEN_FILTER_TIME_OPTIONS.map((time) => {
                  const isSelected =
                    openFilter.mode === "at" && openFilter.time === time;

                  return (
                    <button
                      key={time}
                      type="button"
                      aria-pressed={isSelected}
                      className={cn(
                        "h-8 rounded-sm text-xs font-extrabold transition hover:bg-white hover:text-gray-950 dark:hover:bg-white/10 dark:hover:text-white",
                        isSelected
                          ? "bg-brand text-white dark:text-zinc-950"
                          : "text-gray-500 dark:text-gray-300",
                      )}
                      onClick={() => select({ mode: "at", time })}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
