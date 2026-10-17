"use client";

import { format, isValid, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DateRange,
} from "react-day-picker";
import { cn } from "@/shared/lib/cn";

const toDate = (value: string) => {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
};

type CalendarDateFieldProps = {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
};

const calendarClassNames = () => {
  const defaults = getDefaultClassNames();
  return {
    ...defaults,
    root: cn(defaults.root, "w-full text-gray-900 dark:text-gray-100"),
    month_caption: cn(defaults.month_caption, "mb-3 px-1"),
    caption_label: cn(defaults.caption_label, "text-sm font-extrabold"),
    nav: cn(defaults.nav, "gap-1"),
    button_previous: cn(
      defaults.button_previous,
      "rounded-lg hover:bg-gray-100 dark:hover:bg-white/10",
    ),
    button_next: cn(
      defaults.button_next,
      "rounded-lg hover:bg-gray-100 dark:hover:bg-white/10",
    ),
    month_grid: cn(
      defaults.month_grid,
      "w-full border-separate border-spacing-0",
    ),
    weekdays: cn(defaults.weekdays, "mb-1"),
    weekday: cn(
      defaults.weekday,
      "h-8 text-[11px] font-bold tracking-wide text-gray-400",
    ),
    day: cn(defaults.day, "p-0 text-center"),
    day_button: cn(
      defaults.day_button,
      "h-10 w-10 rounded-full text-sm font-semibold hover:bg-brand/10",
    ),
    selected: cn(defaults.selected, "bg-transparent"),
    range_start: cn(defaults.range_start, "bg-transparent"),
    range_end: cn(defaults.range_end, "bg-transparent"),
    range_middle: cn(defaults.range_middle, "bg-transparent"),
    today: cn(defaults.today, "bg-transparent font-extrabold text-brand"),
    outside: cn(defaults.outside, "text-gray-300 dark:text-gray-600"),
    disabled: cn(defaults.disabled, "cursor-not-allowed opacity-30"),
  };
};

export const CalendarDateField = ({
  ariaLabel,
  className,
  max,
  min,
  onChange,
  placeholder = "날짜를 선택하세요",
  value,
}: CalendarDateFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = toDate(value);
  const fromDate = toDate(min ?? "");
  const toDateLimit = toDate(max ?? "");
  const disabledDays = [
    ...(fromDate ? [{ before: fromDate }] : []),
    ...(toDateLimit ? [{ after: toDateLimit }] : []),
  ];
  const displayValue = selected ? format(selected, "yyyy.MM.dd") : "";

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={`${ariaLabel} 선택`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((open) => !open)}
        className="border-border-soft hover:border-brand/40 focus:border-brand/60 focus:ring-brand/15 flex h-12 w-full items-center gap-3 rounded-2xl border bg-white px-3.5 text-left text-sm font-bold text-gray-900 shadow-sm transition outline-none focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
      >
        <CalendarDays
          size={16}
          className="text-brand shrink-0"
          aria-hidden="true"
        />
        <span
          className={cn("min-w-0 flex-1 truncate", !value && "text-gray-400")}
        >
          {displayValue || placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn(
            "shrink-0 text-gray-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <input
        type="date"
        aria-label={ariaLabel}
        tabIndex={-1}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
      />
      {isOpen && (
        <div
          role="dialog"
          aria-label={`${ariaLabel} 달력`}
          className="border-border-soft absolute top-[calc(100%+10px)] left-0 z-30 min-w-[320px] rounded-[24px] border bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900"
        >
          <DayPicker
            mode="single"
            locale={ko}
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setIsOpen(false);
            }}
            startMonth={fromDate}
            endMonth={toDateLimit}
            disabled={disabledDays}
            showOutsideDays
            classNames={calendarClassNames()}
            modifiersClassNames={{
              selected:
                "bg-transparent [&>button]:rounded-full [&>button]:bg-brand [&>button]:text-white [&>button]:hover:!bg-brand/90",
              today: "font-extrabold text-brand",
              range_start:
                "bg-transparent [&>button]:!w-full [&>button]:!rounded-l-full [&>button]:!rounded-r-none [&>button]:!bg-brand [&>button]:text-white [&>button]:hover:!bg-brand/90",
              range_end:
                "bg-transparent [&>button]:!w-full [&>button]:!rounded-l-none [&>button]:!rounded-r-full [&>button]:!bg-brand [&>button]:text-white [&>button]:hover:!bg-brand/90",
              range_middle:
                "bg-brand-soft text-gray-500 [&>button]:!w-full [&>button]:rounded-none [&>button]:!bg-brand-soft [&>button]:!text-gray-500 [&>button]:hover:!bg-brand-soft [&>button]:hover:!text-gray-500 [&>button]:focus:!bg-brand-soft [&>button]:focus:!text-gray-500",
            }}
          />
        </div>
      )}
    </div>
  );
};

type CalendarDateRangeFieldProps = {
  ariaLabel: string;
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  className?: string;
};

export const CalendarDateRangeField = ({
  ariaLabel,
  className,
  endDate,
  onChange,
  startDate,
}: CalendarDateRangeFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected: DateRange | undefined = startDate
    ? { from: toDate(startDate), to: toDate(endDate) }
    : undefined;
  const displayStart = toDate(startDate);
  const displayEnd = toDate(endDate);
  const displayValue = displayStart
    ? displayEnd
      ? `${format(displayStart, "yyyy.MM.dd")} – ${format(displayEnd, "yyyy.MM.dd")}`
      : `${format(displayStart, "yyyy.MM.dd")} 선택 중`
    : "기간을 선택하세요";

  useEffect(() => {
    if (!isOpen) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={`${ariaLabel} 선택`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((open) => !open)}
        className="border-border-soft hover:border-brand/40 focus:border-brand/60 focus:ring-brand/15 flex h-12 w-full items-center gap-3 rounded-2xl border bg-white px-3.5 text-left text-sm font-bold text-gray-900 shadow-sm transition outline-none focus:ring-2 dark:border-white/10 dark:bg-zinc-950 dark:text-white"
      >
        <CalendarDays
          size={16}
          className="text-brand shrink-0"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">{displayValue}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn(
            "shrink-0 text-gray-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>
      <input
        type="date"
        aria-label="검색 시작일"
        tabIndex={-1}
        value={startDate}
        onChange={(event) =>
          onChange({ startDate: event.target.value, endDate })
        }
        className="sr-only"
      />
      <input
        type="date"
        aria-label="검색 종료일"
        tabIndex={-1}
        value={endDate}
        onChange={(event) =>
          onChange({ startDate, endDate: event.target.value })
        }
        className="sr-only"
      />
      {isOpen && (
        <div
          role="dialog"
          aria-label={`${ariaLabel} 달력`}
          className="border-border-soft absolute top-[calc(100%+10px)] left-0 z-30 min-w-[320px] rounded-[24px] border bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900"
        >
          <p className="bg-brand/5 text-brand dark:bg-brand/10 mb-3 rounded-xl px-3 py-2 text-xs font-bold">
            시작일과 종료일을 차례로 선택하세요
          </p>
          <DayPicker
            mode="range"
            locale={ko}
            selected={selected}
            onSelect={(range) => {
              onChange({
                startDate: range?.from ? format(range.from, "yyyy-MM-dd") : "",
                endDate: range?.to ? format(range.to, "yyyy-MM-dd") : "",
              });
              if (range?.from && range.to) setIsOpen(false);
            }}
            showOutsideDays
            classNames={calendarClassNames()}
            modifiersClassNames={{
              selected:
                "bg-transparent [&>button]:rounded-full [&>button]:bg-brand [&>button]:text-white [&>button]:hover:!bg-brand/90",
              today: "font-extrabold text-brand",
              range_start:
                "bg-transparent [&>button]:!w-full [&>button]:!rounded-l-full [&>button]:!rounded-r-none [&>button]:!bg-brand [&>button]:text-white [&>button]:hover:!bg-brand/90",
              range_end:
                "bg-transparent [&>button]:!w-full [&>button]:!rounded-l-none [&>button]:!rounded-r-full [&>button]:!bg-brand [&>button]:text-white [&>button]:hover:!bg-brand/90",
              range_middle:
                "bg-brand-soft text-gray-500 [&>button]:!w-full [&>button]:rounded-none [&>button]:!bg-brand-soft [&>button]:!text-gray-500 [&>button]:hover:!bg-brand-soft [&>button]:hover:!text-gray-500 [&>button]:focus:!bg-brand-soft [&>button]:focus:!text-gray-500",
            }}
          />
        </div>
      )}
    </div>
  );
};
