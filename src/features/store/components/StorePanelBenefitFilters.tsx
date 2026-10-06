import { BadgePercent } from "lucide-react";
import {
  getServiceFilterBadgeStyle,
  getServiceFilterColor,
  type ServiceFilterOption,
} from "@/features/store/lib/markerColors";
import { cn } from "@/shared/lib/cn";

type StorePanelBenefitFiltersProps = {
  onChange: (nextValue: string[]) => void;
  options: readonly ServiceFilterOption[];
  value: string[];
};

const benefitFilterBadgeClassName =
  "flex h-8 shrink-0 items-center gap-1 rounded-full border bg-white px-3.5 text-xs font-extrabold whitespace-nowrap shadow-sm transition hover:brightness-95 dark:bg-white";

/**
 * 제휴 혜택 탭의 상단 필터 뱃지 줄: 선택한 카테고리의 제휴 혜택/서비스 이름으로 제휴 매장을 거른다.
 * 모양은 매장 탭의 상담·서비스 뱃지(StorePanelServiceFilters)와 맞추되, 필터 로직(혜택 OR 매칭)이 달라 따로 둔다.
 * 모바일은 검색창 아래, 데스크톱은 검색창 오른쪽에서 가로로 밀어 넘긴다.
 */
export const StorePanelBenefitFilters = ({
  onChange,
  options,
  value,
}: StorePanelBenefitFiltersProps) => {
  if (options.length === 0) {
    return null;
  }

  const toggle = (optionValue: string) =>
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    );
  const badges = options.map((option, index) => {
    const isSelected = value.includes(option.value);

    return (
      <button
        key={option.value}
        type="button"
        onClick={() => toggle(option.value)}
        className={cn(benefitFilterBadgeClassName, "snap-start")}
        style={getServiceFilterBadgeStyle(
          getServiceFilterColor(index),
          isSelected,
        )}
        aria-pressed={isSelected}
      >
        <BadgePercent size={13} aria-hidden="true" />
        {option.label}
      </button>
    );
  });

  return (
    <>
      {/* 모바일: 검색창 바로 아래 가로 슬라이드 */}
      <div className="-mx-3 w-[calc(100%+24px)] max-w-none min-w-0 self-stretch sm:mx-0 sm:w-[min(420px,calc(100vw-48px))] sm:max-w-full sm:self-start md:hidden">
        <div
          className="flex snap-x snap-proximity scroll-px-[max(24px,calc((100vw-420px)/2))] scrollbar-none gap-1.5 overflow-x-auto overscroll-x-contain px-[max(24px,calc((100vw-420px)/2))] py-1.5 after:block after:w-px after:shrink-0 sm:scroll-px-1 sm:px-1"
          role="group"
          aria-label="제휴 혜택 및 서비스 필터"
        >
          {badges}
        </div>
      </div>
      {/* 데스크톱: 검색창 오른쪽 한 줄 */}
      <div className="hidden min-w-0 md:flex md:flex-1">
        <div
          className="flex h-12 w-full min-w-0 snap-x snap-proximity scrollbar-none items-center gap-1.5 overflow-x-auto px-2"
          role="group"
          aria-label="제휴 혜택 및 서비스 필터"
        >
          {badges}
        </div>
      </div>
    </>
  );
};
