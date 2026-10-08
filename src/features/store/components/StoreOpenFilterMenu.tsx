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
  };

  return (
    <div
      ref={rootRef}
      className="relative shrink-0"
      onClick={(event) => {
        // 검색창 label 안에 있어, 메뉴 빈 곳을 눌러도 입력창 포커스(검색 기록 열림)로 번지지 않게 한다.
        // 시각 선택(select)은 기본 동작이 있어야 열리므로 막지 않는다.
        event.stopPropagation();
        if (!(event.target instanceof HTMLSelectElement)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition",
          isActive
            ? "bg-brand text-white"
            : "hover:text-brand text-gray-300/90 hover:bg-gray-100 dark:hover:bg-white/10",
        )}
        aria-label={`영업 시간 필터: ${getOpenFilterLabel(openFilter)}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? "store-open-filter-menu" : undefined}
        title={getOpenFilterLabel(openFilter)}
      >
        <Clock3 size={17} />
      </button>

      {isOpen && (
        <div
          id="store-open-filter-menu"
          role="group"
          aria-label="영업 시간 필터"
          className="border-border absolute top-[calc(100%+10px)] right-0 z-50 w-48 rounded-sm border bg-white p-1.5 text-gray-700 shadow-xl dark:border-white/10 dark:bg-zinc-950 dark:text-gray-200"
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
          <div
            className={cn(
              optionClassName,
              "hover:bg-transparent dark:hover:bg-transparent",
            )}
          >
            <span>이 시간에 영업 중</span>
            <select
              value={openFilter.mode === "at" ? openFilter.time : ""}
              onChange={(event) =>
                select({ mode: "at", time: event.target.value })
              }
              className={cn(
                "h-7 rounded-sm border bg-white px-1 text-xs font-bold outline-none dark:bg-zinc-900",
                openFilter.mode === "at"
                  ? "border-brand text-brand"
                  : "border-gray-200 dark:border-white/10",
              )}
              aria-label="영업 중인지 확인할 시각"
            >
              {openFilter.mode !== "at" && (
                <option value="" disabled>
                  {selectedTime}
                </option>
              )}
              {OPEN_FILTER_TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
