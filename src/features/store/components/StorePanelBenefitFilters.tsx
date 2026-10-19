import { BadgePercent } from "lucide-react";
import {
  getServiceFilterBadgeStyle,
  getServiceFilterColor,
  type ServiceFilterOption,
} from "@/entities/store";
import { cn } from "@/shared/lib/cn";

type StorePanelBenefitFiltersProps = {
  /** bar: 지도 위 검색창 옆(모바일은 아래) 한 줄. panel: 매장 목록 사이드바·바텀 시트 안에서 줄바꿈. */
  layout?: "bar" | "panel";
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
  layout = "bar",
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

  if (layout === "panel") {
    return (
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="제휴 혜택 및 서비스 필터"
      >
        {badges}
      </div>
    );
  }

  return (
    <>
      {/* 모바일: 검색창 바로 아래 가로 슬라이드. 위 검색창 줄과 같은 폭으로 가운데에 두고,
          뱃지가 한 줄에 다 들어가면 가운데 정렬한다(넘치면 왼쪽부터 밀어 넘긴다). */}
      <div className="w-full max-w-[476px] min-w-0 self-center sm:self-start md:hidden">
        <div
          className="flex snap-x snap-proximity scrollbar-none gap-1.5 overflow-x-auto overscroll-x-contain px-1 py-1.5 *:first:ml-auto *:last:mr-auto sm:*:first:ml-0"
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
