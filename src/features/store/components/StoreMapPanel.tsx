"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgePercent,
  Bike,
  Bus,
  CalendarCheck,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Clock3,
  CornerUpRight,
  Ellipsis,
  List,
  MapPinned,
  Menu,
  Search,
  SportShoe,
  Store,
  X,
  CardSim,
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
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import { useStoreMapState } from "@/features/store/hooks/useStoreMapState";
import { useStoreSearchHistory } from "@/features/store/hooks/useStoreSearchHistory";
import {
  formatDistance,
  formatDurationSeconds,
  formatRemainingDistance,
  formatWalkingTime,
  getDistanceMeters,
  matchesStoreSearch,
} from "@/features/store/lib/geo";
import { storeService } from "@/features/store/lib/storeService";
import type {
  StoreLocation,
  StoreRoute,
  StoreRouteMode,
} from "@/features/store/types";
import { routes } from "@/shared/constants/routes";
import { cn } from "@/shared/lib/cn";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { showToast } from "@/shared/ui/ToastProvider";

type StoreMapPanelProps = {
  onOpenSidebar?: () => void;
};

const defaultMapLocation = {
  lat: 37.50312732327876,
  lng: 127.04987850743296,
};
const getStoreListLabel = (index: number) =>
  String.fromCharCode(65 + (index % 26));

type MapCategory = "store" | "benefit";

type MapSearchPoint = {
  lat: number;
  lng: number;
};

const serviceBadgeClassName =
  "bg-surface-muted text-text-secondary rounded-full px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300";

const routeModeOptions: {
  icon: typeof SportShoe | typeof Car | typeof Bike | typeof Bus;
  label: string;
  value: StoreRouteMode;
}[] = [
  { icon: SportShoe, label: "도보", value: "walk" },
  { icon: Car, label: "자동차", value: "car" },
  { icon: Bike, label: "자전거", value: "bicycle" },
  { icon: Bus, label: "대중교통", value: "transit" },
];
const mapCategoryOptions: {
  icon: typeof Store | typeof BadgePercent;
  label: string;
  value: MapCategory;
}[] = [
  { icon: Store, label: "매장", value: "store" },
  { icon: BadgePercent, label: "혜택", value: "benefit" },
];
const benefitServicePreviewItems = [
  {
    description:
      "멤버십 제휴 매장과 서비스 혜택을 이 영역에 표시할 예정입니다.",
    title: "제휴 혜택 준비 중",
  },
  {
    description:
      "혜택 API가 연결되면 카테고리별 제휴처를 지도와 함께 확인할 수 있어요.",
    title: "서비스 목록 연동 예정",
  },
];

const noRouteResultMessage =
  "해당 교통 수단의 길찾기 결과가 없습니다.\n다른 이동 수단을 선택해주세요";

type ServiceFilterOption = {
  label: string;
  value: string;
};

type RouteSummary = {
  isLoading?: boolean;
  remainingDistanceText: string;
  travelTimeText: string;
};

/** 필터 바에 최대로 노출하는 뱃지 개수. 폭이 좁으면 한 줄에 들어가는 만큼만 보여주고 나머지는 더보기(…) 드롭다운으로 보낸다. */
const VISIBLE_SERVICE_FILTER_COUNT = 6;
/** 텍스트 검색 반경(km). 주변 매장 조회 반경(storeService)과 같다. */
const SEARCH_RADIUS_KM = 1.5;
/** 지도 핀(A~L)·매장 목록 한 페이지에 보여줄 매장 수. */
const STORES_PER_PAGE = 12;
/** 검색 드롭다운에 보여줄 최대 결과 수(스크롤로 확인). */
const MAX_SEARCH_RESULT_COUNT = 30;
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

const getServiceFilterIcon = (label: string): LucideIcon => {
  const normalizedLabel = label.replace(/\s/g, "").toLowerCase();

  return (
    serviceFilterIconRules.find(({ keywords }) =>
      keywords.some((keyword) => normalizedLabel.includes(keyword)),
    )?.icon ?? Tag
  );
};

/**
 * 페이지 버튼 목록. 페이지가 많으면 처음·끝·현재 주변만 남기고 나머지는 "…"로 줄인다.
 * 예) 현재 6/12 → 1 … 5 6 7 … 12
 */
const getPaginationItems = (
  currentPage: number,
  pageCount: number,
): (number | "ellipsis")[] => {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, page) => page);
  }

  const lastPage = pageCount - 1;
  const start = Math.max(1, Math.min(currentPage - 1, lastPage - 4));
  const end = Math.min(lastPage - 1, Math.max(currentPage + 1, 4));
  const items: (number | "ellipsis")[] = [0];

  // 한 페이지만 건너뛰는 경우엔 "…" 대신 그 번호를 그대로 보여준다.
  if (start === 2) items.push(1);
  else if (start > 2) items.push("ellipsis");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end === lastPage - 2) items.push(lastPage - 1);
  else if (end < lastPage - 2) items.push("ellipsis");
  items.push(lastPage);

  return items;
};

const ServiceFilterCarousel = ({
  "aria-label": ariaLabel,
  consultOptions,
  consultValue,
  onConsultChange,
  onProvidedChange,
  providedOptions,
  providedValue,
}: {
  "aria-label": string;
  consultOptions: readonly ServiceFilterOption[];
  consultValue: string[];
  onConsultChange: (value: string[]) => void;
  onProvidedChange: (value: string[]) => void;
  providedOptions: readonly ServiceFilterOption[];
  providedValue: string[];
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(
    VISIBLE_SERVICE_FILTER_COUNT,
  );
  const filterItems = [
    ...consultOptions.map((option) => ({
      icon: getServiceFilterIcon(option.label),
      key: `consult-${option.value}`,
      label: option.label,
      onChange: onConsultChange,
      optionValue: option.value,
      selectedClassName: "bg-brand text-white",
      unselectedClassName:
        "bg-surface text-text-primary shadow-sm ring-1 ring-border hover:bg-surface-brand-hover dark:ring-white/10",
      value: consultValue,
    })),
    ...providedOptions.map((option) => ({
      icon: getServiceFilterIcon(option.label),
      key: `provided-${option.value}`,
      label: option.label,
      onChange: onProvidedChange,
      optionValue: option.value,
      selectedClassName: "bg-brand text-white",
      unselectedClassName:
        "bg-surface text-text-primary shadow-sm ring-1 ring-border hover:bg-surface-brand-hover dark:ring-white/10",
      value: providedValue,
    })),
  ];
  const measureItems = filterItems.slice(0, VISIBLE_SERVICE_FILTER_COUNT);
  const visibleItems = filterItems.slice(0, visibleCount);
  const hiddenItems = filterItems.slice(visibleCount);
  const hiddenSelectedCount = hiddenItems.filter((item) =>
    item.value.includes(item.optionValue),
  ).length;
  const toggleItem = (item: (typeof filterItems)[number]) => {
    item.onChange(
      item.value.includes(item.optionValue)
        ? item.value.filter((value) => value !== item.optionValue)
        : [...item.value, item.optionValue],
    );
  };

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
              isSelected ? item.selectedClassName : item.unselectedClassName,
            )}
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
                            ? "bg-brand-soft text-text-primary dark:bg-brand/10"
                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]",
                        )}
                        aria-pressed={isSelected}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <item.icon
                            size={14}
                            aria-hidden="true"
                            className="shrink-0 text-gray-400"
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                            isSelected
                              ? "bg-brand border-brand text-white"
                              : "border-gray-300 text-transparent dark:border-white/20",
                          )}
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

const ServiceBadges = ({
  services,
  title,
}: {
  services?: string[];
  title: string;
}) => {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="text-text-secondary mb-2 text-[11px] font-extrabold">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {services.map((service) => (
          <span key={service} className={serviceBadgeClassName}>
            {service}
          </span>
        ))}
      </div>
    </div>
  );
};

const StoreInfoBubble = ({
  isLoading,
  isWaitingForPinSelection,
  isRouteDestination,
  onShowNearbyStores,
  onStartRoute,
  onReserve,
  routeResultMessage,
  routeSummary,
  selectedRouteMode,
  onRouteModeChange,
  store,
}: {
  isLoading: boolean;
  isWaitingForPinSelection: boolean;
  isRouteDestination: boolean;
  onShowNearbyStores: () => void;
  onStartRoute: (store: StoreLocation) => void;
  onReserve: (store: StoreLocation) => void;
  onRouteModeChange: (mode: StoreRouteMode) => void;
  routeResultMessage?: string | null;
  routeSummary?: RouteSummary | null;
  selectedRouteMode: StoreRouteMode;
  store?: StoreLocation;
}) => {
  const title = isLoading
    ? "근처 매장 검색"
    : isWaitingForPinSelection || !store
      ? "매장 선택"
      : "선택한 매장";

  const header = (
    <div className="min-w-0">
      <p className="text-brand text-xs font-bold">{title}</p>
    </div>
  );
  const isRouteMode = Boolean(routeSummary || routeResultMessage);
  const routeModeControl = isRouteMode ? (
    <div className="ml-3 flex shrink-0 gap-1 rounded-sm border border-gray-200 bg-white p-1 text-[11px] font-extrabold shadow-md shadow-gray-950/10 dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/30">
      {routeModeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedRouteMode === option.value;
        const isUnavailable = Boolean(routeResultMessage && isSelected);

        return (
          <button
            key={option.value}
            type="button"
            disabled={isUnavailable}
            onClick={() => onRouteModeChange(option.value)}
            className={cn(
              "group relative flex h-8 w-8 items-center justify-center rounded-sm transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none",
              isUnavailable
                ? "cursor-not-allowed bg-gray-100 text-gray-300 opacity-70 shadow-none dark:bg-white/5 dark:text-gray-600"
                : isSelected
                  ? "bg-brand text-white shadow-sm"
                  : "text-text-secondary hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand",
            )}
            aria-label={`${option.label} 길찾기`}
            aria-pressed={isSelected}
          >
            <Icon size={13} />
            <span className="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1 items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white opacity-0 shadow-xl transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  ) : null;

  if (isLoading) {
    return (
      <div className="border-border after:border-border relative w-full rounded-sm border bg-white/95 p-4 text-sm shadow-lg backdrop-blur after:absolute after:bottom-[-7px] after:left-1/2 after:h-3.5 after:w-3.5 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:bg-white/95 dark:border-white/10 dark:bg-zinc-950/92 dark:after:border-white/10 dark:after:bg-zinc-950/92">
        {header}
        <div className="mt-3 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="border-brand size-4 animate-spin rounded-full border-2 border-t-transparent"
          />
          <div>
            <p className="font-extrabold text-gray-950 dark:text-white">
              근처 매장을 불러오는 중
            </p>
            <p className="text-text-secondary mt-1 text-xs font-semibold">
              새 기준 위치 주변 매장을 찾고 있어요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isWaitingForPinSelection || !store) {
    return (
      <div className="border-border after:border-border relative w-full rounded-sm border bg-white/95 p-4 text-sm shadow-lg backdrop-blur after:absolute after:bottom-[-7px] after:left-1/2 after:h-3.5 after:w-3.5 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:bg-white/95 dark:border-white/10 dark:bg-zinc-950/92 dark:after:border-white/10 dark:after:bg-zinc-950/92">
        {header}
        <div className="mt-3">
          <p className="font-extrabold text-gray-950 dark:text-white">
            매장 핀을 선택해 주세요
          </p>
          <p className="text-text-secondary mt-1 text-xs leading-5 font-semibold">
            지도 위 매장 핀을 누르면 운영시간과 예약 정보를 확인할 수 있어요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border after:border-border relative w-full rounded-sm border bg-white/95 p-4 text-left text-sm shadow-lg backdrop-blur after:absolute after:bottom-[-7px] after:left-1/2 after:h-3.5 after:w-3.5 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:bg-white/95 dark:border-white/10 dark:bg-zinc-950/92 dark:after:border-white/10 dark:after:bg-zinc-950/92">
      <div className="flex items-start justify-between gap-2">
        {header}
        {routeModeControl}
      </div>
      <div className="mt-3">
        <p className="text-base font-extrabold text-gray-950 dark:text-white">
          {store.name}
        </p>

        <p className="text-text-secondary mt-1 text-xs leading-5 font-semibold">
          {store.address || "상세 주소 확인 중"}
        </p>
        {store.phone && (
          <p className="text-text-secondary mt-2 text-xs font-semibold">
            {store.phone}
          </p>
        )}
        {/* 길찾기 중에는 경로 정보에 집중하도록 운영시간·서비스 뱃지를 숨겨 카드 높이를 줄인다. */}
        {!isRouteMode && store.businessHours && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="text-text-secondary">
              운영시간 {store.businessHours}
            </span>
          </div>
        )}
        {!isRouteMode && (
          <>
            <ServiceBadges title="상담 가능" services={store.consultServices} />
            <ServiceBadges
              title="제공 서비스"
              services={store.providedServices}
            />
          </>
        )}

        {routeResultMessage ? (
          <div className="bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand mt-3 rounded-sm px-3 py-2.5 text-xs leading-5 font-extrabold whitespace-pre-line">
            {routeResultMessage}
          </div>
        ) : routeSummary ? (
          <div className="bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand mt-3 grid grid-cols-2 divide-x divide-current/15 rounded-sm py-2 text-[11px] font-extrabold">
            <span className="px-3">
              남은 거리
              <strong className="mt-0.5 block text-sm">
                {routeSummary.isLoading
                  ? "계산 중"
                  : routeSummary.remainingDistanceText}
              </strong>
            </span>
            <span className="px-3">
              예상 시간
              <strong className="mt-0.5 block text-sm">
                {routeSummary.isLoading
                  ? "계산 중"
                  : routeSummary.travelTimeText}
              </strong>
            </span>
          </div>
        ) : null}

        <div
          className={cn(
            "gap-2",
            isRouteMode
              ? "mt-3 grid grid-cols-2"
              : "mt-4 flex flex-wrap justify-end",
          )}
        >
          {isRouteDestination ? (
            <Button
              variant="primary"
              size="sm"
              className={cn(
                "rounded-sm shadow-sm transition-shadow hover:shadow-md",
                isRouteMode && "h-9! px-3! text-[13px]!",
              )}
              onClick={onShowNearbyStores}
            >
              <MapPinned size={16} />
              다른 매장 보기
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className={cn(
                "rounded-sm shadow-sm transition-shadow hover:shadow-md",
                isRouteMode && "h-9! px-3! text-[13px]!",
              )}
              onClick={() => onStartRoute(store)}
            >
              <CornerUpRight size={16} />
              길찾기
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "rounded-sm shadow-sm transition-shadow hover:shadow-md",
              isRouteMode && "h-9! px-3! text-[13px]!",
            )}
            onClick={() => onReserve(store)}
          >
            <CalendarCheck size={16} />
            예약하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export const StoreMapPanel = ({ onOpenSidebar }: StoreMapPanelProps) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthUser();
  const [stores, setStores] = useState<StoreLocation[]>([]);
  const [focusPoint, setFocusPoint] = useState<MapSearchPoint | null>(
    defaultMapLocation,
  );
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);
  const [soloStoreId, setSoloStoreId] = useState("");
  const [mapCenter, setMapCenter] = useState<MapSearchPoint | null>(null);
  const [storePage, setStorePage] = useState(0);
  const [isStorePaginationOn, setIsStorePaginationOn] = useState(false);
  const [storePageSourceKey, setStorePageSourceKey] = useState("");
  const [submittedSearchStores, setSubmittedSearchStores] = useState<
    StoreLocation[] | null
  >(null);
  const [searchFitTarget, setSearchFitTarget] = useState<{
    key: string;
    points: MapSearchPoint[];
  } | null>(null);
  // 좌표가 실제로 바뀐 경우에만 상태를 갱신해 불필요한 재렌더를 막는다.
  const updateMapCenter = useCallback((point: MapSearchPoint) => {
    setMapCenter((prevPoint) =>
      prevPoint &&
      Math.abs(prevPoint.lat - point.lat) < 1e-7 &&
      Math.abs(prevPoint.lng - point.lng) < 1e-7
        ? prevPoint
        : point,
    );
  }, []);
  // 검색용 매장 풀: 검색 기준 지역(지도 중심)마다 주변 매장을 조회해 누적한다.
  const [allStores, setAllStores] = useState<StoreLocation[]>([]);
  const loadedSearchAreaKeyRef = useRef("");
  const {
    addHistory: addSearchHistory,
    clearHistory: clearSearchHistory,
    history: searchHistory,
    isHistoryEnabled: isSearchHistoryEnabled,
    removeHistory: removeSearchHistory,
    toggleHistoryEnabled: toggleSearchHistoryEnabled,
  } = useStoreSearchHistory();
  const [searchPoint, setSearchPoint] = useState<MapSearchPoint | null>(null);
  const [isMapSearchLoading, setIsMapSearchLoading] = useState(false);
  const [isWaitingForPinSelection, setIsWaitingForPinSelection] =
    useState(false);
  const [hasSelectedStoreInfo, setHasSelectedStoreInfo] = useState(false);
  const [reservationStore, setReservationStore] =
    useState<StoreLocation | null>(null);
  const [isLocationPermissionModalOpen, setIsLocationPermissionModalOpen] =
    useState(true);
  const [isLoginRequiredModalOpen, setIsLoginRequiredModalOpen] =
    useState(false);
  const [isStoreListCollapsed, setIsStoreListCollapsed] = useState(true);
  const [isToastBackdropVisible, setIsToastBackdropVisible] = useState(false);
  const [consultServiceFilters, setConsultServiceFilters] = useState<string[]>(
    [],
  );
  const [providedServiceFilters, setProvidedServiceFilters] = useState<
    string[]
  >([]);
  const [activeMapCategory, setActiveMapCategory] =
    useState<MapCategory>("store");
  const collapsedSearchRef = useRef<HTMLDivElement>(null);
  const hasFocusedInitialLocationRef = useRef(false);
  const lastNearbyLookupKeyRef = useRef("");
  const shouldFocusUserLocationRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRootRef = useRef<HTMLDivElement>(null);
  // 같은 검색어로 다시 검색해도 지도 범위를 다시 맞추도록 fit 요청마다 증가시키는 번호.
  const searchFitSeqRef = useRef(0);
  const [routeLeftInset, setRouteLeftInset] = useState(0);
  const {
    displayStores,
    locationStatus,
    requestLocation,
    searchQuery,
    selectedStore,
    setSearchQuery,
    setSelectedStoreId,
    userLocation,
    watchLocation,
  } = useStoreMapState(stores);
  const [routeDestinationStoreId, setRouteDestinationStoreId] = useState("");
  const [walkingRoute, setWalkingRoute] = useState<StoreRoute | null>(null);
  const [routeMode, setRouteMode] = useState<StoreRouteMode>("walk");
  const [routeResultMessage, setRouteResultMessage] = useState<string | null>(
    null,
  );
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const consultServiceFilterOptions = useMemo(
    () =>
      Array.from(
        new Set(stores.flatMap((store) => store.consultServices ?? [])),
      ).map((service) => ({ label: service, value: service })),
    [stores],
  );
  const providedServiceFilterOptions = useMemo(
    () =>
      Array.from(
        new Set(stores.flatMap((store) => store.providedServices ?? [])),
      ).map((service) => ({ label: service, value: service })),
    [stores],
  );
  const filterStoresByServices = (storeRows: StoreLocation[]) =>
    storeRows.filter((store) => {
      const consultServices = store.consultServices ?? [];
      const providedServices = store.providedServices ?? [];
      const matchesConsultService = consultServiceFilters.every((service) =>
        consultServices.includes(service),
      );
      const matchesProvidedService = providedServiceFilters.every((service) =>
        providedServices.includes(service),
      );

      return matchesConsultService && matchesProvidedService;
    });
  const categoryStores =
    activeMapCategory === "store" ? filterStoresByServices(stores) : [];
  const categoryDisplayStores =
    activeMapCategory === "store" ? filterStoresByServices(displayStores) : [];
  const categorySelectedStore =
    activeMapCategory === "store"
      ? (categoryDisplayStores.find(
          (store) => store.id === selectedStore?.id,
        ) ??
        categoryStores.find((store) => store.id === selectedStore?.id) ??
        categoryDisplayStores[0] ??
        categoryStores[0])
      : undefined;
  const hasActiveServiceFilter =
    consultServiceFilters.length > 0 || providedServiceFilters.length > 0;
  // 검색 풀 = 지역별로 조회해 둔 매장(allStores) + 현재 지도에 불러온 매장(stores).
  const searchableStores = useMemo(() => {
    const storeMap = new Map<string, StoreLocation>();

    allStores.forEach((store) => {
      storeMap.set(store.id, store);
    });
    stores.forEach((store) => {
      storeMap.set(store.id, { ...storeMap.get(store.id), ...store });
    });

    return Array.from(storeMap.values()).map((store) =>
      userLocation
        ? {
            ...store,
            distanceText: formatDistance(
              getDistanceMeters(userLocation, store),
            ),
          }
        : store,
    );
  }, [allStores, stores, userLocation]);
  // "#뱃지" 형태의 검색어는 필터 뱃지로 입력된 태그 검색이다(텍스트 매칭 대상 아님).
  const isTagSearchQuery = searchQuery.trim().startsWith("#");
  const matchedSearchStores =
    activeMapCategory !== "store"
      ? []
      : isTagSearchQuery
        ? filterStoresByServices(displayStores)
        : searchableStores.filter((store) =>
            matchesStoreSearch(store, searchQuery),
          );
  // 텍스트 검색은 지금 보고 있는 지도 중심 반경 안의 매장만 대상으로 하고, 중심에서 가까운 순으로 정렬한다.
  const searchCenter =
    mapCenter ??
    focusPoint ??
    (userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : defaultMapLocation);
  const searchCenterKey = `${searchCenter.lat.toFixed(4)}:${searchCenter.lng.toFixed(4)}`;
  const getTextSearchResults = (pool: StoreLocation[]) =>
    pool
      .filter((store) => matchesStoreSearch(store, searchQuery))
      .map((store) => ({
        store,
        distanceMeters: getDistanceMeters(searchCenter, store),
      }))
      .filter(({ distanceMeters }) => distanceMeters <= SEARCH_RADIUS_KM * 1000)
      .sort((first, second) => first.distanceMeters - second.distanceMeters)
      .map(({ store, distanceMeters }) => ({
        ...store,
        distanceText: formatDistance(distanceMeters),
      }));
  // 텍스트 검색 결과(서비스 필터 적용 전). Enter 검색 시 이 목록을 저장해 두고 뱃지로 다시 거른다.
  const textSearchStores = isTagSearchQuery
    ? matchedSearchStores
    : activeMapCategory === "store"
      ? getTextSearchResults(searchableStores)
      : [];
  const searchResultStores = isTagSearchQuery
    ? textSearchStores
    : filterStoresByServices(textSearchStores);
  // Enter로 검색하면 검색 결과 매장들을 지도 핀·매장 목록에 보여주고, 상단 뱃지로 그 안에서 다시 거른다.
  const mapStores = submittedSearchStores
    ? filterStoresByServices(submittedSearchStores)
    : hasActiveServiceFilter
      ? categoryDisplayStores
      : categoryStores;
  const routeDestinationStore =
    categoryStores.find((store) => store.id === routeDestinationStoreId) ??
    stores.find((store) => store.id === routeDestinationStoreId);
  // 매장 목록에서 고른 매장은 정보 카드가 떠 있는 동안 그 핀만 남기고 다른 핀은 숨긴다.
  const soloStore =
    hasSelectedStoreInfo && soloStoreId
      ? (categoryStores.find((store) => store.id === soloStoreId) ??
        stores.find((store) => store.id === soloStoreId))
      : undefined;
  // 매장이 12개를 넘으면 12개씩 페이지로 나눈다. 기본은 첫 12개만, "더보기"를 누르면 페이지 이동이 켜진다.
  const mapStoresKey = mapStores.map((store) => store.id).join(",");

  if (storePageSourceKey !== mapStoresKey) {
    setStorePageSourceKey(mapStoresKey);
    setStorePage(0);
    setIsStorePaginationOn(false);
  }

  const storePageCount = Math.max(
    1,
    Math.ceil(mapStores.length / STORES_PER_PAGE),
  );
  const currentStorePage = Math.min(storePage, storePageCount - 1);
  const pagedMapStores = mapStores.slice(
    currentStorePage * STORES_PER_PAGE,
    (currentStorePage + 1) * STORES_PER_PAGE,
  );
  const hasMoreStorePages = mapStores.length > STORES_PER_PAGE;
  const markerLabelById = Object.fromEntries(
    pagedMapStores.map((store, index) => [store.id, getStoreListLabel(index)]),
  );
  const goToStorePage = (page: number) => {
    const nextPage = Math.min(Math.max(0, page), storePageCount - 1);
    const pageStores = mapStores.slice(
      nextPage * STORES_PER_PAGE,
      (nextPage + 1) * STORES_PER_PAGE,
    );

    setStorePage(nextPage);
    setSoloStoreId("");
    setHasSelectedStoreInfo(false);

    // 페이지를 넘기면 그 페이지 매장 핀(A~L)이 모두 보이도록 지도 범위를 맞춘다.
    if (pageStores.length > 0) {
      setSearchFitTarget({
        key: `page:${mapStoresKey}:${nextPage}`,
        points: pageStores.map((store) => ({ lat: store.lat, lng: store.lng })),
      });
    }
  };
  const visibleMapStores =
    routeDestinationStoreId && routeDestinationStore
      ? [routeDestinationStore]
      : soloStore
        ? [soloStore]
        : pagedMapStores;
  const routeSummary = (() => {
    if (!userLocation || !routeDestinationStore) {
      return null;
    }

    const remainingDistanceMeters =
      walkingRoute?.distanceMeters ??
      getDistanceMeters(userLocation, routeDestinationStore);

    return {
      isLoading: isRouteLoading,
      remainingDistanceText: formatRemainingDistance(remainingDistanceMeters),
      travelTimeText: walkingRoute
        ? formatDurationSeconds(walkingRoute.durationSeconds)
        : formatWalkingTime(remainingDistanceMeters),
    };
  })();
  const routePreview = (() => {
    if (!userLocation || !routeDestinationStore || routeResultMessage) {
      return null;
    }

    // 경로를 불러오는 동안에는 선을 그리지 않는다. 대체 경로(내 위치→매장 직선)를 먼저 그리면
    // 건물을 가로지르는 직선이 보였다가 실제 경로로 바뀌어, 잘못된 경로처럼 보인다.
    // 로딩 상태는 경로 검색 오버레이(isRouteSearchOverlayVisible)가 대신 보여준다.
    if (isRouteLoading && !walkingRoute?.path.length) {
      return null;
    }

    const destination = {
      lat: routeDestinationStore.lat,
      lng: routeDestinationStore.lng,
    };
    const fallbackPath = [userLocation, destination];
    const routePath = walkingRoute?.path.length
      ? [userLocation, ...walkingRoute.path, destination]
      : fallbackPath;
    const routeKey = walkingRoute?.path.length
      ? `route:${routeDestinationStoreId}:${walkingRoute.mode}`
      : `fallback:${routeDestinationStoreId}:${routeMode}`;

    return {
      destination,
      mode: routeMode,
      origin: userLocation,
      path: routePath,
      routeKey,
      segments: walkingRoute?.segments,
    };
  })();
  const isRouteSearchOverlayVisible =
    isRouteLoading &&
    locationStatus !== "denied" &&
    locationStatus !== "error" &&
    locationStatus !== "unsupported";
  const nearbyLookup = useMemo(() => {
    const lookupLocation = userLocation ?? defaultMapLocation;

    if (!lookupLocation) {
      return null;
    }

    const lat = Number(lookupLocation.lat.toFixed(3));
    const lng = Number(lookupLocation.lng.toFixed(3));

    return {
      key: `${lat}:${lng}`,
      location: { lat, lng },
    };
  }, [userLocation]);

  const updateStoresByLocation = (
    lookupLocation: MapSearchPoint,
    options?: { showLoadingCard?: boolean },
  ) => {
    let isCurrentRequest = true;

    // 새 지역을 조회하면 이전 Enter 검색 결과 표시는 해제한다.
    setSubmittedSearchStores(null);

    if (options?.showLoadingCard) {
      setIsMapSearchLoading(true);
      setIsWaitingForPinSelection(false);
      setHasSelectedStoreInfo(false);
    }

    storeService
      .fetchNearbyStores(lookupLocation)
      .then((nearbyStores) => {
        if (isCurrentRequest) {
          setStores(nearbyStores);
          if (options?.showLoadingCard) {
            setHasSelectedStoreInfo(false);
            setSelectedStoreId("");
            setIsWaitingForPinSelection(true);
          }
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setStores([]);
          if (options?.showLoadingCard) {
            setHasSelectedStoreInfo(false);
            setSelectedStoreId("");
            setIsWaitingForPinSelection(true);
          }
        }
      })
      .finally(() => {
        if (isCurrentRequest && options?.showLoadingCard) {
          setIsMapSearchLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  };

  /**
   * 필터 뱃지 변경. 검색창이 비어 있거나 이미 태그 검색(#…) 중이면
   * 선택한 뱃지를 "#텍스트"로 입력창에 넣고, 현재 지도 영역에서 매장을 다시 조회해 목록·핀으로 보여준다.
   */
  const handleServiceFilterChange = (
    kind: "consult" | "provided",
    nextValue: string[],
  ) => {
    const nextConsult = kind === "consult" ? nextValue : consultServiceFilters;
    const nextProvided =
      kind === "provided" ? nextValue : providedServiceFilters;

    if (kind === "consult") {
      setConsultServiceFilters(nextValue);
    } else {
      setProvidedServiceFilters(nextValue);
    }

    if (searchQuery.trim() && !isTagSearchQuery) {
      return;
    }

    const tags = [...nextConsult, ...nextProvided];

    setSearchQuery(tags.map((tag) => `#${tag}`).join(" "));
    setIsSearchHistoryOpen(false);

    if (tags.length === 0) {
      return;
    }

    const areaPoint =
      searchPoint ??
      focusPoint ??
      (userLocation
        ? { lat: userLocation.lat, lng: userLocation.lng }
        : defaultMapLocation);

    resetRouteState();
    setSearchPoint(null);
    setHasSelectedStoreInfo(false);
    setIsStoreListCollapsed(false);
    updateStoresByLocation(areaPoint);
  };
  /** Enter 또는 검색 아이콘: 현재 지역(반경) 검색 결과를 지도 핀·목록에 모두 보여준다. */
  const submitStoreSearch = async () => {
    setIsSearchHistoryOpen(false);

    if (isTagSearchQuery || !searchQuery.trim()) {
      return;
    }

    addSearchHistory(searchQuery);

    // 지도를 옮긴 뒤 아직 그 지역 매장을 불러오지 않았다면 먼저 불러온 뒤 검색한다.
    const loadedAreaStores = await loadSearchAreaStores();
    const textSearchStores = loadedAreaStores
      ? getTextSearchResults([...searchableStores, ...loadedAreaStores])
      : getTextSearchResults(searchableStores);

    if (textSearchStores.length === 0) {
      showToast("이 지역에 검색 결과가 없어요.");
      return;
    }

    const visibleResults = filterStoresByServices(textSearchStores);

    resetRouteState();
    setSoloStoreId("");
    setHasSelectedStoreInfo(false);
    setSearchPoint(null);
    setSubmittedSearchStores(textSearchStores);
    setIsStoreListCollapsed(false);

    if (visibleResults.length > 0) {
      setSearchFitTarget({
        key: `search:${(searchFitSeqRef.current += 1)}`,
        points: visibleResults
          .slice(0, STORES_PER_PAGE)
          .map((store) => ({ lat: store.lat, lng: store.lng })),
      });
    }

    searchInputRef.current?.blur();
  };
  /** 뱃지 필터를 모두 해제하고 기본 검색 방식(내 위치/기본 위치 주변 매장)으로 되돌린다. */
  const clearServiceFilters = () => {
    setConsultServiceFilters([]);
    setProvidedServiceFilters([]);

    // Enter 검색 결과를 보고 있는 중이면 결과는 그대로 두고 필터만 푼다.
    if (submittedSearchStores && !isTagSearchQuery) {
      return;
    }

    setSubmittedSearchStores(null);

    if (isTagSearchQuery) {
      setSearchQuery("");
    }

    if (nearbyLookup) {
      lastNearbyLookupKeyRef.current = nearbyLookup.key;
      updateStoresByLocation(nearbyLookup.location);
    }
  };
  const handleStoreSelect = (
    storeId: string,
    options?: { focusMap?: boolean; showOnlySelected?: boolean },
  ) => {
    setSoloStoreId(options?.showOnlySelected ? storeId : "");

    // 길찾기 중 다른 매장을 고르면 기존 경로를 지우고 새로 고른 매장 정보만 보여준다.
    if (routeDestinationStoreId && routeDestinationStoreId !== storeId) {
      resetRouteState();
    }

    setHasSelectedStoreInfo(true);
    setIsWaitingForPinSelection(false);
    setSelectedStoreId(storeId);

    const nextStore =
      categoryDisplayStores.find((store) => store.id === storeId) ??
      categoryStores.find((store) => store.id === storeId) ??
      searchableStores.find((store) => store.id === storeId) ??
      stores.find((store) => store.id === storeId);

    if (nextStore && !stores.some((store) => store.id === nextStore.id)) {
      setStores((prevStores) => [...prevStores, nextStore]);
    }

    storeService
      .fetchStoreDetail(storeId, nextStore)
      .then((storeDetail) => {
        if (!storeDetail) {
          return;
        }

        setStores((prevStores) => {
          const hasStore = prevStores.some((store) => store.id === storeId);

          if (!hasStore) {
            return [...prevStores, storeDetail];
          }

          return prevStores.map((store) =>
            store.id === storeId
              ? {
                  ...store,
                  ...storeDetail,
                  distanceText: storeDetail.distanceText ?? store.distanceText,
                }
              : store,
          );
        });
      })
      .catch(() => {
        if (!nextStore) {
          showToast("매장 정보를 불러오지 못했어요.");
        }
      });

    if (options?.focusMap) {
      if (nextStore) {
        setFocusPoint({ lat: nextStore.lat, lng: nextStore.lng });
        setSearchPoint(null);
      }
    }
  };

  const handleRouteStart = (store: StoreLocation) => {
    setRouteDestinationStoreId(store.id);
    setWalkingRoute(null);
    setRouteResultMessage(null);
    setIsRouteLoading(true);
    handleStoreSelect(store.id, { focusMap: true });
    watchLocation();

    if (!userLocation) {
      setIsLocationPermissionModalOpen(true);
      showToast("현재 위치를 확인한 뒤 경로를 표시할게요.");
    }
  };
  const changeRouteMode = (nextMode: StoreRouteMode) => {
    setRouteMode(nextMode);
    setWalkingRoute(null);
    setRouteResultMessage(null);
    setIsRouteLoading(Boolean(routeDestinationStoreId));
  };
  useEffect(() => {
    if (!routeDestinationStoreId || !userLocation) {
      return;
    }

    let isCurrentRequest = true;

    storeService
      .fetchRoute(routeDestinationStoreId, userLocation, routeMode)
      .then((route) => {
        if (isCurrentRequest) {
          setWalkingRoute(route);
          setRouteResultMessage(null);
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setWalkingRoute(null);
          setRouteResultMessage(noRouteResultMessage);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsRouteLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [routeDestinationStoreId, routeMode, userLocation]);

  const handleReservationConfirm = () => {
    if (!reservationStore) {
      return;
    }

    setReservationStore(null);
    setIsToastBackdropVisible(true);
    showToast("예약이 완료되었습니다.");

    window.setTimeout(() => {
      setIsToastBackdropVisible(false);
    }, 1700);
  };
  const handleReserve = (store: StoreLocation) => {
    if (isAuthLoading) {
      showToast("로그인 상태를 확인하고 있어요.");
      return;
    }

    if (!isAuthenticated) {
      setIsLoginRequiredModalOpen(true);
      return;
    }

    setReservationStore(store);
  };

  const closeSelectedStoreInfo = () => {
    setHasSelectedStoreInfo(false);
    setSoloStoreId("");
  };
  const resetRouteState = () => {
    setRouteDestinationStoreId("");
    setWalkingRoute(null);
    setRouteResultMessage(null);
    setIsRouteLoading(false);
  };
  const showNearbyStoresAfterRoute = () => {
    const currentPoint = routeDestinationStore
      ? { lat: routeDestinationStore.lat, lng: routeDestinationStore.lng }
      : userLocation
        ? { lat: userLocation.lat, lng: userLocation.lng }
        : defaultMapLocation;

    resetRouteState();
    setActiveMapCategory("store");
    setSearchQuery("");
    setIsSearchHistoryOpen(false);
    setHasSelectedStoreInfo(false);
    setIsWaitingForPinSelection(true);
    setSelectedStoreId("");
    setFocusPoint(currentPoint);
    setSearchPoint(currentPoint);
    updateStoresByLocation(currentPoint, { showLoadingCard: true });
  };
  const focusUserLocation = () => {
    shouldFocusUserLocationRef.current = true;
    requestLocation();

    if (userLocation) {
      setFocusPoint({
        lat: userLocation.lat,
        lng: userLocation.lng,
      });
      setSearchPoint(null);
      hasFocusedInitialLocationRef.current = true;
      shouldFocusUserLocationRef.current = false;

      if (!routeDestinationStoreId) {
        storeService
          .fetchNearbyStores({ lat: userLocation.lat, lng: userLocation.lng })
          .then(setStores)
          .catch(() => {
            showToast("주변 매장을 불러오지 못했어요.");
          });
      }
    }

    if (routeDestinationStoreId) {
      watchLocation();
    }
  };
  const requestUserLocationFromModal = () => {
    setIsLocationPermissionModalOpen(false);
    focusUserLocation();
  };
  const mapSelectedStore = categorySelectedStore ?? routeDestinationStore;
  const mapSelectedStoreId =
    categorySelectedStore?.id ?? routeDestinationStore?.id ?? "";
  const showStoreInfoCard =
    hasSelectedStoreInfo &&
    (isWaitingForPinSelection || Boolean(mapSelectedStore));

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    if (
      !hasFocusedInitialLocationRef.current ||
      shouldFocusUserLocationRef.current
    ) {
      const shouldShowCurrentLocationSearch =
        shouldFocusUserLocationRef.current;

      setFocusPoint({ lat: userLocation.lat, lng: userLocation.lng });
      setSearchPoint(null);
      hasFocusedInitialLocationRef.current = true;
      shouldFocusUserLocationRef.current = false;

      if (shouldShowCurrentLocationSearch) {
        // 위치 동의/내 위치 버튼 직후에는 "이 위치에서 검색"을 거치지 않고 바로 주변 매장 핀을 띄운다.
        const lat = Number(userLocation.lat.toFixed(3));
        const lng = Number(userLocation.lng.toFixed(3));

        lastNearbyLookupKeyRef.current = `${lat}:${lng}`;
        storeService
          .fetchNearbyStores({ lat, lng })
          .then(setStores)
          .catch(() => {
            showToast("주변 매장을 불러오지 못했어요.");
          });
      }
    }
  }, [userLocation]);

  useEffect(() => {
    if (!nearbyLookup) {
      return;
    }

    if (lastNearbyLookupKeyRef.current === nearbyLookup.key) {
      return;
    }

    lastNearbyLookupKeyRef.current = nearbyLookup.key;

    let isCurrentRequest = true;

    storeService
      .fetchNearbyStores(nearbyLookup.location)
      .then((nearbyStores) => {
        if (isCurrentRequest) {
          setStores(nearbyStores);
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setStores([]);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [nearbyLookup]);

  const mergeSearchStores = (nextStores: StoreLocation[]) => {
    setAllStores((prevStores) => {
      const storeMap = new Map(prevStores.map((store) => [store.id, store]));

      nextStores.forEach((store) => {
        storeMap.set(store.id, { ...storeMap.get(store.id), ...store });
      });

      return Array.from(storeMap.values());
    });
  };
  /** 현재 검색 기준 지역(지도 중심) 주변 매장을 조회해 검색 풀에 넣는다. 이미 조회한 지역이면 건너뛴다. */
  const loadSearchAreaStores = async () => {
    if (loadedSearchAreaKeyRef.current === searchCenterKey) {
      return null;
    }

    try {
      const areaStores = await storeService.fetchNearbyStores(searchCenter);

      loadedSearchAreaKeyRef.current = searchCenterKey;
      mergeSearchStores(areaStores);

      return areaStores;
    } catch {
      return null;
    }
  };
  const runStoreSearch = (storeId: string, query = searchQuery) => {
    handleStoreSelect(storeId, { focusMap: true });

    if (!query.trim().startsWith("#")) {
      addSearchHistory(query, storeId);
    }
    setIsSearchHistoryOpen(false);
  };

  // 검색창/매장 목록 패널의 오른쪽 끝(지도 기준 px)을 재서 길찾기 경로 여백으로 쓴다.
  useEffect(() => {
    const panelRoot = panelRootRef.current;
    const searchPanel = collapsedSearchRef.current;

    if (!panelRoot || !searchPanel) {
      return;
    }

    const updateRouteLeftInset = () => {
      const rootRect = panelRoot.getBoundingClientRect();
      const searchRect = searchPanel.getBoundingClientRect();

      setRouteLeftInset(
        Math.max(0, Math.round(searchRect.right - rootRect.left)),
      );
    };

    updateRouteLeftInset();

    const resizeObserver = new ResizeObserver(updateRouteLeftInset);

    resizeObserver.observe(panelRoot);
    resizeObserver.observe(searchPanel);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isSearchHistoryOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        collapsedSearchRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsSearchHistoryOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isSearchHistoryOpen]);

  useEffect(() => {
    if (!isSearchHistoryOpen && isStoreListCollapsed) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsSearchHistoryOpen(false);
      setIsStoreListCollapsed(true);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchHistoryOpen, isStoreListCollapsed]);

  return (
    <div
      ref={panelRootRef}
      className="relative h-full min-h-[640px] overflow-hidden"
    >
      <StoreMapPreview
        className="absolute inset-0"
        focusPoint={focusPoint}
        fitTarget={searchFitTarget}
        isFullBleed
        isSearchFromMapPointLoading={isMapSearchLoading}
        routePreview={routePreview}
        isRouteCardDocked={Boolean(
          routeDestinationStoreId &&
          routeDestinationStoreId === mapSelectedStore?.id,
        )}
        selectedStore={showStoreInfoCard ? mapSelectedStore : undefined}
        selectedStoreCard={
          showStoreInfoCard ? (
            <StoreInfoBubble
              isLoading={isMapSearchLoading}
              isWaitingForPinSelection={isWaitingForPinSelection}
              isRouteDestination={Boolean(
                routeDestinationStoreId &&
                routeDestinationStoreId === mapSelectedStore?.id,
              )}
              routeSummary={
                routeDestinationStoreId === mapSelectedStore?.id
                  ? routeSummary
                  : null
              }
              routeResultMessage={
                routeDestinationStoreId === mapSelectedStore?.id
                  ? routeResultMessage
                  : null
              }
              selectedRouteMode={routeMode}
              store={isWaitingForPinSelection ? undefined : mapSelectedStore}
              onShowNearbyStores={showNearbyStoresAfterRoute}
              onStartRoute={handleRouteStart}
              onRouteModeChange={changeRouteMode}
              onReserve={handleReserve}
            />
          ) : null
        }
        selectedStoreCardLeftInset={isStoreListCollapsed ? 0 : routeLeftInset}
        routeLeftInset={routeLeftInset}
        selectedStoreId={showStoreInfoCard ? mapSelectedStoreId : ""}
        stores={visibleMapStores}
        markerLabelById={markerLabelById}
        searchPoint={searchPoint}
        userLocation={userLocation}
        isUserLocationLoading={locationStatus === "requesting"}
        onFocusUserLocation={focusUserLocation}
        onMapPointSelect={setSearchPoint}
        onCenterChange={updateMapCenter}
        onSelectedStoreCardClose={closeSelectedStoreInfo}
        onSearchFromMapPoint={() => {
          if (!searchPoint) {
            return;
          }

          updateStoresByLocation(searchPoint, { showLoadingCard: true });
        }}
        onSelectStore={handleStoreSelect}
      />

      <div className="pointer-events-none absolute inset-0 z-10 pt-16 md:pt-0">
        <div className="pointer-events-auto absolute top-3 right-3 left-3 flex flex-col gap-3 md:top-5 md:right-5 md:left-5 md:flex-row md:flex-wrap md:items-start">
          <div className="flex min-w-0 flex-col gap-3 md:flex-1 md:flex-row md:flex-nowrap md:items-start">
            <div
              ref={collapsedSearchRef}
              className="relative w-[min(420px,calc(100vw-48px))] max-w-full min-w-0 self-start md:w-[360px] lg:w-[420px]"
            >
              <div className="relative z-30 flex h-12 items-center rounded-sm bg-white text-left shadow-sm dark:bg-zinc-950">
                {onOpenSidebar && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenSidebar();
                    }}
                    className="text-brand hover:bg-brand-soft ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition md:hidden"
                    aria-label="사이드바 열기"
                  >
                    <Menu size={20} />
                  </button>
                )}
                <label className="flex h-full min-w-0 flex-1 items-center justify-between gap-3 rounded-l-sm bg-white px-3.5 text-sm font-semibold text-gray-400 dark:bg-zinc-950">
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => {
                      const nextQuery = event.target.value;

                      // 태그 검색어를 모두 지우면 뱃지 필터도 함께 해제한다.
                      if (isTagSearchQuery && !nextQuery.trim()) {
                        setConsultServiceFilters([]);
                        setProvidedServiceFilters([]);
                      }

                      setSubmittedSearchStores(null);
                      setSearchQuery(nextQuery);
                    }}
                    onFocus={() => {
                      setIsSearchHistoryOpen(true);
                      void loadSearchAreaStores();
                    }}
                    onMouseDown={() => {
                      if (document.activeElement === searchInputRef.current) {
                        setIsSearchHistoryOpen((isOpen) => !isOpen);
                        void loadSearchAreaStores();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void submitStoreSearch();
                      }
                    }}
                    placeholder="매장명, 주소, 전화번호 검색"
                    className="min-w-0 flex-1 truncate bg-transparent text-sm font-semibold text-gray-700 outline-none placeholder:text-gray-400/85 dark:text-white"
                    aria-label="매장명, 주소, 전화번호 검색"
                    title={isTagSearchQuery ? searchQuery : undefined}
                  />
                  {hasActiveServiceFilter && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        clearServiceFilters();
                        searchInputRef.current?.focus();
                      }}
                      className="group/clear relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 dark:text-gray-500 dark:hover:bg-white/10 dark:hover:text-gray-300"
                      aria-label="선택한 필터 모두 해제"
                    >
                      <CircleX size={17} />
                      <span className="pointer-events-none absolute top-[calc(100%+10px)] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1 items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white opacity-0 shadow-xl transition duration-150 group-hover/clear:translate-y-0 group-hover/clear:opacity-100 group-focus-visible/clear:translate-y-0 group-focus-visible/clear:opacity-100">
                        필터 모두 해제
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void submitStoreSearch();
                    }}
                    className="hover:text-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300/90 transition hover:bg-gray-100 dark:hover:bg-white/10"
                    aria-label="검색"
                  >
                    <Search size={22} />
                  </button>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setIsStoreListCollapsed((isCollapsed) => !isCollapsed)
                  }
                  className="border-border hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand group relative flex h-full w-12 shrink-0 items-center justify-center rounded-r-sm border-l bg-white text-xs font-extrabold text-gray-500 transition dark:border-white/10 dark:bg-zinc-950 dark:text-gray-300"
                  aria-expanded={!isStoreListCollapsed}
                  aria-label={
                    isStoreListCollapsed ? "지점 목록 펼치기" : "지점 목록 접기"
                  }
                >
                  <List
                    size={18}
                    className="transition group-hover:scale-0 group-hover:opacity-0"
                  />
                  <span className="absolute inset-0 flex scale-75 items-center justify-center opacity-0 transition group-hover:scale-100 group-hover:opacity-100">
                    {activeMapCategory === "store"
                      ? mapStores.length
                      : benefitServicePreviewItems.length}
                    개
                  </span>
                  <span className="pointer-events-none absolute top-[calc(100%+8px)] right-0 z-50 flex translate-y-1 items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white opacity-0 shadow-xl transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                    {activeMapCategory === "store"
                      ? "매장 목록"
                      : "제휴 혜택/서비스 목록"}
                  </span>
                </button>
              </div>

              {isSearchHistoryOpen && (
                <div className="absolute top-12 left-0 z-20 w-full overflow-hidden bg-white text-sm shadow-sm dark:bg-zinc-950">
                  {searchQuery ? (
                    <div className="max-h-[232px] overflow-y-auto overscroll-contain py-1">
                      {searchResultStores
                        .slice(0, MAX_SEARCH_RESULT_COUNT)
                        .map((store) => (
                          <button
                            key={store.id}
                            type="button"
                            onClick={() => runStoreSearch(store.id)}
                            className="flex h-11 w-full items-center justify-between gap-3 px-5 text-left text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                          >
                            <span className="min-w-0 truncate">
                              {store.name}
                            </span>
                            {store.distanceText && (
                              <span className="shrink-0 text-xs text-gray-400">
                                {store.distanceText}
                              </span>
                            )}
                          </button>
                        ))}

                      {searchResultStores.length === 0 && (
                        <div className="flex h-14 cursor-default items-center justify-center text-sm font-medium text-gray-400/85">
                          이 지역(반경 {SEARCH_RADIUS_KM}km)에 검색 결과가
                          없어요.
                        </div>
                      )}
                    </div>
                  ) : isSearchHistoryEnabled && searchHistory.length > 0 ? (
                    <div className="max-h-[232px] overflow-y-auto overscroll-contain py-1">
                      {searchHistory.map((item) => (
                        <div
                          key={item.query}
                          className="group flex items-center hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery(item.query);

                              if (item.storeId) {
                                runStoreSearch(item.storeId, item.query);
                              } else {
                                searchInputRef.current?.focus();
                              }
                            }}
                            className="flex h-11 min-w-0 flex-1 items-center gap-3 pl-5 text-left text-sm font-semibold text-gray-600 dark:text-gray-200"
                          >
                            <Clock3
                              size={15}
                              className="shrink-0 text-gray-300"
                              aria-hidden="true"
                            />
                            <span className="min-w-0 truncate">
                              {item.query}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSearchHistory(item.query)}
                            className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-white/10"
                            aria-label={`${item.query} 검색 기록 삭제`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-14 cursor-default items-center justify-center gap-2 text-gray-400/85">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-gray-300/80 text-[11px] leading-none font-bold text-gray-300">
                        i
                      </span>
                      <span className="text-sm font-medium">
                        {isSearchHistoryEnabled
                          ? "히스토리가 없어요."
                          : "검색 히스토리 저장이 꺼져 있어요."}
                      </span>
                    </div>
                  )}
                  {!searchQuery && (
                    <div className="flex h-12 cursor-default items-center justify-between gap-3 bg-gray-50 px-5 dark:bg-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleSearchHistoryEnabled}
                          className="cursor-pointer text-sm font-medium text-gray-400/90 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          {isSearchHistoryEnabled
                            ? "히스토리 끄기"
                            : "히스토리 켜기"}
                        </button>
                      </div>
                      {isSearchHistoryEnabled && searchHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={clearSearchHistory}
                          className="cursor-pointer text-sm font-medium text-gray-400/90 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          전체 삭제
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isStoreListCollapsed && (
                <div className="absolute top-12 left-0 z-10 w-full overflow-hidden rounded-b-sm bg-white/95 shadow-sm backdrop-blur dark:bg-zinc-950/95">
                  <div className="border-border flex h-12 items-center justify-between gap-3 border-b px-3 dark:border-white/10">
                    <span className="min-w-0 truncate text-sm font-extrabold text-gray-950 dark:text-white">
                      {activeMapCategory === "store"
                        ? "매장 목록"
                        : "제휴 혜택/서비스 목록"}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="flex items-center gap-1 rounded-sm border border-gray-200 bg-white p-0.5 text-[11px] font-extrabold dark:border-white/10 dark:bg-zinc-950">
                        {mapCategoryOptions.map((item) => {
                          const Icon = item.icon;
                          const isSelected = activeMapCategory === item.value;

                          return (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => setActiveMapCategory(item.value)}
                              className={cn(
                                "group relative flex h-7 w-7 items-center justify-center rounded-sm transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none",
                                isSelected
                                  ? "bg-brand text-white dark:text-zinc-950"
                                  : "text-text-secondary hover:bg-brand-soft hover:text-brand-hover dark:hover:bg-brand/10 dark:hover:text-brand",
                              )}
                              aria-label={`${item.label} 보기`}
                              aria-pressed={isSelected}
                            >
                              <Icon size={14} />
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsStoreListCollapsed(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:hover:bg-white/10 dark:hover:text-gray-200"
                        aria-label="매장 목록 닫기"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[min(48vh,372px)] overflow-y-auto py-1">
                    {activeMapCategory === "store" ? (
                      <>
                        {pagedMapStores.map((store, index) => (
                          <button
                            key={store.id}
                            type="button"
                            onClick={() =>
                              handleStoreSelect(store.id, {
                                focusMap: true,
                                showOnlySelected: true,
                              })
                            }
                            className={cn(
                              "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.04]",
                              mapSelectedStoreId === store.id &&
                                "bg-brand-soft dark:bg-brand/10",
                            )}
                            aria-pressed={mapSelectedStoreId === store.id}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs font-black",
                                mapSelectedStoreId === store.id
                                  ? "bg-brand text-white"
                                  : "bg-brand/10 text-brand",
                              )}
                            >
                              {getStoreListLabel(index)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-extrabold text-gray-800 dark:text-white">
                                  {store.name}
                                </span>
                                {store.distanceText && (
                                  <span className="shrink-0 text-[11px] font-bold text-gray-400">
                                    {store.distanceText}
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block truncate text-xs font-medium text-gray-400">
                                {store.address || "상세 주소 확인 중"}
                              </span>
                            </span>
                          </button>
                        ))}

                        {mapStores.length === 0 && (
                          <div className="flex h-20 items-center justify-center text-sm font-semibold text-gray-400">
                            표시할 매장이 없어요.
                          </div>
                        )}

                        {hasMoreStorePages && !isStorePaginationOn && (
                          <button
                            type="button"
                            onClick={() => setIsStorePaginationOn(true)}
                            className="text-text-secondary hover:text-text-primary flex h-11 w-full items-center justify-center gap-1 text-xs font-extrabold transition hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                          >
                            더보기
                            <span className="text-gray-400">
                              ({mapStores.length - STORES_PER_PAGE}개 더)
                            </span>
                            <ChevronDown size={14} />
                          </button>
                        )}

                        {hasMoreStorePages && isStorePaginationOn && (
                          <nav
                            aria-label="매장 목록 페이지"
                            className="flex h-11 items-center justify-center gap-1"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                goToStorePage(currentStorePage - 1)
                              }
                              disabled={currentStorePage === 0}
                              className="text-text-secondary flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/10"
                              aria-label="이전 페이지"
                            >
                              <ChevronLeft size={15} />
                            </button>
                            {getPaginationItems(
                              currentStorePage,
                              storePageCount,
                            ).map((page, index) =>
                              page === "ellipsis" ? (
                                <span
                                  key={`ellipsis-${index}`}
                                  aria-hidden="true"
                                  className="flex h-7 w-5 items-center justify-center text-xs font-extrabold text-gray-400"
                                >
                                  …
                                </span>
                              ) : (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() => goToStorePage(page)}
                                  className={cn(
                                    "flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-extrabold transition",
                                    page === currentStorePage
                                      ? "bg-brand text-white"
                                      : "text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10",
                                  )}
                                  aria-current={
                                    page === currentStorePage
                                      ? "page"
                                      : undefined
                                  }
                                >
                                  {page + 1}
                                </button>
                              ),
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                goToStorePage(currentStorePage + 1)
                              }
                              disabled={currentStorePage === storePageCount - 1}
                              className="text-text-secondary flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/10"
                              aria-label="다음 페이지"
                            >
                              <ChevronRight size={15} />
                            </button>
                          </nav>
                        )}
                      </>
                    ) : (
                      <div className="space-y-1 px-2 py-2">
                        {benefitServicePreviewItems.map((item) => (
                          <div
                            key={item.title}
                            className="rounded-sm px-3 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                          >
                            <span className="flex items-start gap-3">
                              <span
                                aria-hidden="true"
                                className="bg-brand/10 text-brand mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm"
                              >
                                <BadgePercent size={15} />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-extrabold text-gray-800 dark:text-white">
                                  {item.title}
                                </span>
                                <span className="mt-1 block text-xs leading-5 font-medium text-gray-400">
                                  {item.description}
                                </span>
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden min-w-0 md:flex md:flex-1">
              <ServiceFilterCarousel
                aria-label="상담 및 서비스 카테고리 필터"
                consultOptions={consultServiceFilterOptions}
                consultValue={consultServiceFilters}
                onConsultChange={(value) =>
                  handleServiceFilterChange("consult", value)
                }
                onProvidedChange={(value) =>
                  handleServiceFilterChange("provided", value)
                }
                providedOptions={providedServiceFilterOptions}
                providedValue={providedServiceFilters}
              />
            </div>
          </div>
        </div>
      </div>

      {isToastBackdropVisible && (
        <div
          className="pointer-events-none fixed inset-0 z-[990] bg-gray-950/20 transition-opacity"
          aria-hidden="true"
        />
      )}

      {isRouteSearchOverlayVisible && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-gray-950/45 px-6 backdrop-blur-[2px]">
          <div className="border-border w-full max-w-[320px] rounded-sm border bg-white/95 p-5 text-center shadow-2xl dark:border-white/10 dark:bg-zinc-950/95">
            <span
              aria-hidden="true"
              className="border-brand mx-auto block size-8 animate-spin rounded-full border-4 border-t-transparent"
            />
            <p className="mt-4 text-sm font-extrabold text-gray-950 dark:text-white">
              이동 경로 탐색 중
            </p>
            <p className="text-text-secondary mt-2 text-xs leading-5 font-semibold">
              현재 위치에서 선택한 매장까지의 경로와 예상 시간을 계산하고
              있어요.
            </p>
          </div>
        </div>
      )}

      <Modal
        isOpen={isLocationPermissionModalOpen}
        onClose={() => setIsLocationPermissionModalOpen(false)}
        title="내 위치를 사용할까요?"
        description="현재 위치 주변의 VITA 매장을 지도에서 바로 확인할 수 있어요."
        size="sm"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsLocationPermissionModalOpen(false)}
            >
              나중에
            </Button>
            <Button
              size="sm"
              onClick={requestUserLocationFromModal}
              disabled={locationStatus === "requesting"}
            >
              위치 허용
            </Button>
          </>
        }
      >
        위치 정보는 근처 매장 조회와 길찾기 출발지 계산에만 사용됩니다.
      </Modal>

      <Modal
        isOpen={reservationStore !== null}
        onClose={() => setReservationStore(null)}
        title="예약 확인"
        description={
          reservationStore
            ? `${reservationStore.name} 방문 예약을 진행할까요?`
            : undefined
        }
        size="sm"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReservationStore(null)}
            >
              취소
            </Button>
            <Button size="sm" onClick={handleReservationConfirm}>
              예약하기
            </Button>
          </>
        }
      >
        예약 후 매장 방문 전 운영시간과 상담 가능 서비스를 한 번 더 확인해
        주세요.
      </Modal>

      <Modal
        isOpen={isLoginRequiredModalOpen}
        onClose={() => setIsLoginRequiredModalOpen(false)}
        title="로그인이 필요해요"
        description="매장 방문 예약은 로그인 후 이용할 수 있어요."
        size="sm"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsLoginRequiredModalOpen(false)}
            >
              닫기
            </Button>
            <ButtonLink href={routes.login} size="sm">
              로그인하기
            </ButtonLink>
          </>
        }
      >
        매장 위치 확인과 길찾기는 로그인 없이 계속 이용할 수 있습니다.
      </Modal>
    </div>
  );
};
