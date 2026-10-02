"use client";

import {
  BadgePercent,
  CardSim,
  Check,
  Ellipsis,
  Headset,
  Link2,
  Phone,
  Plane,
  ReceiptText,
  RefreshCcw,
  Smartphone,
  Tag,
  Tv,
  UserPlus,
  Wallet,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getServiceFilterBadgeStyle,
  getServiceFilterColor,
  type ServiceFilterOption,
} from "@/features/store/lib/markerColors";
import { cn } from "@/shared/lib/cn";

/** 필터 바에 최대로 노출하는 뱃지 개수. 폭이 좁으면 한 줄에 들어가는 만큼만 보여주고 나머지는 더보기(…) 드롭다운으로 보낸다. */
const VISIBLE_SERVICE_FILTER_COUNT = 6;
const SERVICE_FILTER_GAP_PX = 6;
const SERVICE_FILTER_MORE_BUTTON_PX = 32;
const serviceFilterBadgeClassName =
  "flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 text-xs font-extrabold whitespace-nowrap transition";

/** 서비스 이름의 키워드로 뱃지 아이콘을 고른다. 매칭되지 않으면 기본 태그 아이콘. */
const serviceFilterIconRules: { icon: LucideIcon; keywords: string[] }[] = [
  { icon: CardSim, keywords: ["유심", "usim", "esim", "심카드"] },
  { icon: Smartphone, keywords: ["휴대폰", "단말", "폰", "기기", "모바일"] },
  { icon: Wifi, keywords: ["인터넷", "와이파이", "wifi", "공유기"] },
  { icon: Tv, keywords: ["tv", "iptv", "티비"] },
  { icon: Wallet, keywords: ["수납", "납부", "결제", "청구"] },
  { icon: ReceiptText, keywords: ["요금"] },
  { icon: UserPlus, keywords: ["개통", "가입", "신규", "명의"] },
  { icon: Wrench, keywords: ["수리", "as", "a/s", "파손", "고장", "분실"] },
  { icon: RefreshCcw, keywords: ["반납", "교체", "보상", "중고"] },
  { icon: Plane, keywords: ["로밍", "해외"] },
  { icon: Link2, keywords: ["결합"] },
  { icon: BadgePercent, keywords: ["멤버십", "할인", "혜택"] },
  { icon: Phone, keywords: ["전화", "번호"] },
  { icon: Headset, keywords: ["상담"] },
];

export const getServiceFilterIcon = (label: string): LucideIcon => {
  const normalizedLabel = label.replace(/\s/g, "").toLowerCase();

  return (
    serviceFilterIconRules.find(({ keywords }) =>
      keywords.some((keyword) => normalizedLabel.includes(keyword)),
    )?.icon ?? Tag
  );
};

type ServiceFilterCarouselProps = {
  "aria-label": string;
  consultOptions: readonly ServiceFilterOption[];
  consultValue: string[];
  onConsultChange: (value: string[]) => void;
  onProvidedChange: (value: string[]) => void;
  providedOptions: readonly ServiceFilterOption[];
  providedValue: string[];
};

/** 상담/제공 서비스 옵션을 뱃지 항목 하나의 목록으로 합친다(데스크톱·모바일 공용). */
const buildServiceFilterItems = ({
  consultOptions,
  consultValue,
  onConsultChange,
  onProvidedChange,
  providedOptions,
  providedValue,
}: Omit<ServiceFilterCarouselProps, "aria-label">) => [
  ...consultOptions.map((option, index) => ({
    icon: getServiceFilterIcon(option.label),
    key: `consult-${option.value}`,
    label: option.label,
    onChange: onConsultChange,
    optionValue: option.value,
    pointColor: getServiceFilterColor(index),
    value: consultValue,
  })),
  ...providedOptions.map((option, index) => ({
    icon: getServiceFilterIcon(option.label),
    key: `provided-${option.value}`,
    label: option.label,
    onChange: onProvidedChange,
    optionValue: option.value,
    pointColor: getServiceFilterColor(consultOptions.length + index),
    value: providedValue,
  })),
];

type ServiceFilterItem = ReturnType<typeof buildServiceFilterItems>[number];

const toggleServiceFilterItem = (item: ServiceFilterItem) => {
  item.onChange(
    item.value.includes(item.optionValue)
      ? item.value.filter((value) => value !== item.optionValue)
      : [...item.value, item.optionValue],
  );
};

/**
 * 모바일 필터 뱃지: 검색창 바로 아래에서 좌우로 밀어 넘기는 슬라이드(캐러셀) 형태.
 * 폭 계산/"…" 드롭다운 없이 모든 뱃지를 한 줄에 두고 가로 스크롤 + 스냅으로 넘긴다.
 */
export const MobileServiceFilterCarousel = ({
  "aria-label": ariaLabel,
  ...props
}: ServiceFilterCarouselProps) => {
  const filterItems = buildServiceFilterItems(props);

  if (filterItems.length === 0) {
    return null;
  }

  return (
    <div
      // 양 끝을 흐리게 가리던 mask를 없애고, 좌우 여백을 스크롤 영역 안쪽에 둬서
      // 첫/마지막 뱃지가 잘리지 않고 화면 끝에서 자연스럽게 넘어가게 한다.
      // 위아래 여백은 뱃지 테두리·그림자가 스크롤 영역에 잘리지 않도록 확보한다.
      className="flex snap-x snap-proximity scroll-px-[max(24px,calc((100vw-420px)/2))] scrollbar-none gap-1.5 overflow-x-auto overscroll-x-contain px-[max(24px,calc((100vw-420px)/2))] py-1.5 after:block after:w-px after:shrink-0 sm:scroll-px-1 sm:px-1"
      role="group"
      aria-label={ariaLabel}
    >
      {filterItems.map((item) => {
        const isSelected = item.value.includes(item.optionValue);

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => toggleServiceFilterItem(item)}
            className={cn(
              serviceFilterBadgeClassName,
              "snap-start",
              "border bg-white shadow-sm hover:brightness-95 dark:bg-white",
            )}
            style={getServiceFilterBadgeStyle(item.pointColor, isSelected)}
            aria-pressed={isSelected}
          >
            <item.icon size={13} aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export const ServiceFilterCarousel = ({
  "aria-label": ariaLabel,
  consultOptions,
  consultValue,
  onConsultChange,
  onProvidedChange,
  providedOptions,
  providedValue,
}: ServiceFilterCarouselProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(
    VISIBLE_SERVICE_FILTER_COUNT,
  );
  const filterItems = buildServiceFilterItems({
    consultOptions,
    consultValue,
    onConsultChange,
    onProvidedChange,
    providedOptions,
    providedValue,
  });
  const measureItems = filterItems.slice(0, VISIBLE_SERVICE_FILTER_COUNT);
  const visibleItems = filterItems.slice(0, visibleCount);
  const hiddenItems = filterItems.slice(visibleCount);
  const hiddenSelectedCount = hiddenItems.filter((item) =>
    item.value.includes(item.optionValue),
  ).length;
  const toggleItem = toggleServiceFilterItem;

  // 컨테이너 폭에 맞춰 한 줄에 들어가는 뱃지 개수를 계산한다(최대 6개, 넘치면 … 버튼 자리 확보).
  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;

    if (!container || !measure) {
      return;
    }

    const totalCount = filterItems.length;
    const updateVisibleCount = () => {
      const styles = window.getComputedStyle(container);
      const availableWidth =
        container.clientWidth -
        parseFloat(styles.paddingLeft) -
        parseFloat(styles.paddingRight);
      const badgeWidths = Array.from(measure.children).map(
        (child) => child.getBoundingClientRect().width,
      );
      let usedWidth = 0;
      let nextCount = 0;

      for (let index = 0; index < badgeWidths.length; index += 1) {
        const nextWidth =
          usedWidth +
          (index > 0 ? SERVICE_FILTER_GAP_PX : 0) +
          badgeWidths[index];
        const needsMoreButton = totalCount > index + 1;
        const reservedWidth = needsMoreButton
          ? SERVICE_FILTER_GAP_PX + SERVICE_FILTER_MORE_BUTTON_PX
          : 0;

        if (nextWidth + reservedWidth > availableWidth) {
          break;
        }

        usedWidth = nextWidth;
        nextCount = index + 1;
      }

      setVisibleCount(nextCount);
    };

    updateVisibleCount();

    const resizeObserver = new ResizeObserver(updateVisibleCount);

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [filterItems.length]);

  useEffect(() => {
    if (!isMoreOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        containerRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsMoreOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-12 w-full min-w-0 items-center gap-1.5 px-2"
      role="group"
      aria-label={ariaLabel}
    >
      {/* 폭 계산용 보이지 않는 측정 행 */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 flex gap-1.5"
      >
        {measureItems.map((item) => (
          <span key={item.key} className={serviceFilterBadgeClassName}>
            <item.icon size={13} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>
      {visibleItems.map((item) => {
        const isSelected = item.value.includes(item.optionValue);

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => toggleItem(item)}
            className={cn(
              serviceFilterBadgeClassName,
              "border bg-white shadow-sm hover:brightness-95 dark:bg-white",
            )}
            style={getServiceFilterBadgeStyle(item.pointColor, isSelected)}
            aria-pressed={isSelected}
          >
            <item.icon size={13} aria-hidden="true" />
            {item.label}
          </button>
        );
      })}

      {hiddenItems.length > 0 && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMoreOpen((isOpen) => !isOpen)}
            className={cn(
              "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm transition",
              "bg-surface text-text-secondary ring-border hover:bg-surface-brand-hover hover:text-text-primary ring-1 dark:ring-white/10",
              isMoreOpen && "ring-brand ring-2",
            )}
            aria-expanded={isMoreOpen}
            aria-haspopup="true"
            aria-label={`필터 더보기 (${hiddenItems.length}개${
              hiddenSelectedCount > 0 ? `, ${hiddenSelectedCount}개 선택됨` : ""
            })`}
          >
            <Ellipsis size={18} />
            {/* 숨은 항목 중 선택한 개수를 모서리에 표시한다. */}
            {hiddenSelectedCount > 0 && (
              <span className="bg-brand absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-black text-white">
                {hiddenSelectedCount}
              </span>
            )}
          </button>
          {isMoreOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 z-40 w-56 overflow-hidden rounded-sm bg-white shadow-lg ring-1 ring-gray-950/5 dark:bg-zinc-950 dark:ring-white/10">
              <ul className="max-h-60 overflow-y-auto py-1">
                {hiddenItems.map((item) => {
                  const isSelected = item.value.includes(item.optionValue);

                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => toggleItem(item)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-semibold transition",
                          isSelected
                            ? "dark:bg-white"
                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]",
                        )}
                        style={
                          isSelected
                            ? getServiceFilterBadgeStyle(item.pointColor, true)
                            : undefined
                        }
                        aria-pressed={isSelected}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <item.icon
                            size={14}
                            aria-hidden="true"
                            className={cn(
                              "shrink-0",
                              !isSelected && "text-gray-400",
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                            isSelected
                              ? "text-white"
                              : "border-gray-300 text-transparent dark:border-white/20",
                          )}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: item.pointColor,
                                  borderColor: item.pointColor,
                                }
                              : undefined
                          }
                        >
                          <Check size={12} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
