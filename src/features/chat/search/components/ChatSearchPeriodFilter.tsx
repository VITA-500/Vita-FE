import { FilterDropdown } from "@/shared/ui/molecules/FilterDropdown";
import {
  CalendarDateField,
  CalendarDateRangeField,
} from "@/shared/ui/molecules/CalendarDateField";
import {
  emptySearchPeriod,
  searchPeriodOptions,
  type SearchPeriod,
  type SearchPeriodSelection,
} from "@/features/chat/search/lib/chatSearch";

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
          <CalendarDateField
            ariaLabel="검색 날짜"
            value={selectedDate}
            onChange={(date) => onChange({ ...valueState, selectedDate: date })}
            className="mt-1"
          />
        </label>
      )}
      {period === "range" && (
        <div className="mt-3">
          <CalendarDateRangeField
            ariaLabel="검색 기간"
            startDate={startDate}
            endDate={endDate}
            onChange={(range) => onChange({ ...valueState, ...range })}
          />
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
