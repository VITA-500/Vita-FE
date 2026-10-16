import { FilterDropdown } from "@/shared/ui/FilterDropdown";
import {
  emptySearchPeriod,
  searchPeriodOptions,
  type SearchPeriod,
  type SearchPeriodSelection,
} from "../lib/chatSearch";

export const ChatSearchPeriodFilter = ({
  valueState,
  onChange,
  resultCount,
}: {
  valueState: SearchPeriodSelection;
  onChange: (value: SearchPeriodSelection) => void;
  resultCount: number;
}) => {
  const { period, selectedDate, startDate, endDate } = valueState;
  const invalidRange =
    period === "range" && Boolean(startDate && endDate && startDate > endDate);
  return (
    <div className="border-b border-gray-100 px-6 pb-4 dark:border-white/10">
      <div className="flex items-center justify-between gap-3">
        <FilterDropdown
          aria-label="조회 기간"
          className="w-40"
          options={searchPeriodOptions}
          value={period}
          onChange={(value) =>
            onChange({ ...valueState, period: value as SearchPeriod })
          }
        />
        <span
          className="text-xs font-semibold text-gray-400"
          aria-live="polite"
        >
          상담 {resultCount}개
        </span>
      </div>
      {period === "date" && (
        <label className="mt-3 block text-xs font-semibold text-gray-500 dark:text-gray-400">
          날짜 선택
          <input
            type="date"
            aria-label="검색 날짜"
            value={selectedDate}
            onChange={(event) =>
              onChange({ ...valueState, selectedDate: event.target.value })
            }
            className="mt-1 block h-10 w-full rounded-xl border border-gray-200 bg-transparent px-3 text-sm text-gray-900 dark:border-white/15 dark:text-white dark:scheme-dark"
          />
        </label>
      )}
      {period === "range" && (
        <div className="mt-3 flex items-end gap-2">
          <label className="min-w-0 flex-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            시작일
            <input
              type="date"
              aria-label="검색 시작일"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) =>
                onChange({ ...valueState, startDate: event.target.value })
              }
              className="mt-1 block h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-transparent px-3 text-sm text-gray-900 dark:border-white/15 dark:text-white dark:scheme-dark"
            />
          </label>
          <span className="pb-2 text-gray-400" aria-hidden="true">
            –
          </span>
          <label className="min-w-0 flex-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            종료일
            <input
              type="date"
              aria-label="검색 종료일"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) =>
                onChange({ ...valueState, endDate: event.target.value })
              }
              className="mt-1 block h-10 w-full min-w-0 rounded-xl border border-gray-200 bg-transparent px-3 text-sm text-gray-900 dark:border-white/15 dark:text-white dark:scheme-dark"
            />
          </label>
        </div>
      )}
      {period !== "all" && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            상담의 최근 수정일 기준이에요.
          </p>
          <button
            type="button"
            onClick={() => {
              onChange(emptySearchPeriod);
            }}
            className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            날짜 초기화
          </button>
        </div>
      )}
      {invalidRange && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          종료일은 시작일 이후로 지정해 주세요.
        </p>
      )}
    </div>
  );
};
