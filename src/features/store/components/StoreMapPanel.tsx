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
import { findServicesInText } from "@/features/store/lib/serviceKeywords";
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

/** 지금 보이는 지도 영역 (중심·북동·남서 모서리) */
type MapViewport = {
  center: { lat: number; lng: number };
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
};
/** 화면 영역 검색 시 조회 반경 상한(km). 지도를 크게 축소해도 이 반경까지만 불러온다. */
const MAX_VIEWPORT_SEARCH_RADIUS_KM = 3;
/** "이 지역에 매장 없음" 안내 후 직전 지역으로 지도를 되돌리기까지의 지연(ms). */
const RESTORE_AREA_DELAY_MS = 1400;
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

/** 위치 허용 모달에서 "위치 허용"을 누른 적이 있는지(권한 API가 없는 브라우저용 보조 기록). */
const LOCATION_CONSENT_STORAGE_KEY = "vita-store-location-consent";
/** 이번 세션에서 위치 허용 모달을 "나중에"로 닫았는지. */
const LOCATION_MODAL_DISMISSED_STORAGE_KEY =
  "vita-store-location-modal-dismissed";

const readStorage = (storage: "local" | "session", key: string) => {
  try {
    return (
      storage === "local" ? window.localStorage : window.sessionStorage
    ).getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (
  storage: "local" | "session",
  key: string,
  value: string,
) => {
  try {
    (storage === "local" ? window.localStorage : window.sessionStorage).setItem(
      key,
      value,
    );
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 기록 없이 진행한다.
  }
};

/** 브라우저의 위치 권한 상태. 권한 API를 지원하지 않으면 null. */
const getGeolocationPermissionState =
  async (): Promise<PermissionState | null> => {
    try {
      const status = await navigator.permissions?.query({
        name: "geolocation",
      });

      return status?.state ?? null;
    } catch {
      return null;
    }
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
const MobileServiceFilterCarousel = ({
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
              isSelected ? item.selectedClassName : item.unselectedClassName,
            )}
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

const toStableServiceOptions = (services: string[], selected: string[]) =>
  Array.from(new Set([...services, ...selected]))
    .sort((first, second) => first.localeCompare(second, "ko"))
    .map((service) => ({ label: service, value: service }));

const ServiceFilterCarousel = ({
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
  onSelectSameLocationStore,
  sameLocationStores = [],
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
  /** 선택 매장과 같은 좌표에 있는 매장들(선택 매장 포함). 2곳 이상이면 카드 상단에서 넘겨 볼 수 있다. */
  sameLocationStores?: StoreLocation[];
  onSelectSameLocationStore?: (storeId: string) => void;
  store?: StoreLocation;
}) => {
  const title = isLoading
    ? "근처 매장 검색"
    : isWaitingForPinSelection || !store
      ? "매장 선택"
      : "선택한 매장";

  const isRouteMode = Boolean(routeSummary || routeResultMessage);
  const sameLocationIndex = store
    ? sameLocationStores.findIndex((item) => item.id === store.id)
    : -1;
  const canBrowseSameLocation =
    !isRouteMode &&
    Boolean(onSelectSameLocationStore) &&
    sameLocationStores.length > 1 &&
    sameLocationIndex >= 0;
  const moveSameLocationStore = (direction: -1 | 1) => {
    const count = sameLocationStores.length;
    const nextStore =
      sameLocationStores[(sameLocationIndex + direction + count) % count];

    onSelectSameLocationStore?.(nextStore.id);
  };
  const header = (
    <div className="flex min-w-0 items-center gap-2">
      <p className="text-brand text-xs font-bold">{title}</p>
      {canBrowseSameLocation && (
        // 같은 위치 매장이 여러 곳이면 좌우 화살표로 바로 넘겨 본다.
        <div className="text-text-secondary flex items-center gap-0.5 rounded-full bg-gray-100 px-0.5 text-[11px] font-extrabold dark:bg-white/10">
          <button
            type="button"
            onClick={() => moveSameLocationStore(-1)}
            className="hover:text-text-primary flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white dark:hover:bg-white/10"
            aria-label="같은 위치의 이전 매장"
          >
            <ChevronLeft size={14} />
          </button>
          <span aria-live="polite">
            {sameLocationIndex + 1}/{sameLocationStores.length}
          </span>
          <button
            type="button"
            onClick={() => moveSameLocationStore(1)}
            className="hover:text-text-primary flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-white dark:hover:bg-white/10"
            aria-label="같은 위치의 다음 매장"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
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
  // 현재 stores를 조회한 기준 지점(내 위치·지도에서 고른 지점 등). 매장 순서(A, B, C…)는 이 지점에서 가까운 순이다.
  const [storesOrigin, setStoresOrigin] = useState<MapSearchPoint | null>(null);
  const [isStorePaginationOn, setIsStorePaginationOn] = useState(false);
  const [storePageSourceKey, setStorePageSourceKey] = useState("");
  const [submittedSearchOrigin, setSubmittedSearchOrigin] =
    useState<MapSearchPoint | null>(null);
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
  // 지금 보이는 지도 영역(지도 이동·확대/축소가 끝날 때마다 갱신)
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null);
  // 텍스트 검색 정렬 중심 좌표의 출처: 내 위치 버튼·위치 허용 → "user", 사용자가 지도를 직접 옮김 → "map"
  const [searchAnchorSource, setSearchAnchorSource] = useState<"user" | "map">(
    "user",
  );
  // 텍스트 검색 결과에서 골라 stores에 새로 추가된 매장 id (검색을 지우면 stores에서 뺀다)
  const searchAddedStoreIdsRef = useRef<Set<string>>(new Set());
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
  // 위치 허용 모달은 진입할 때마다 무조건 띄우지 않고, 권한 상태를 확인한 뒤 필요할 때만 연다.
  const [isLocationPermissionModalOpen, setIsLocationPermissionModalOpen] =
    useState(false);
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
  // 마지막으로 매장이 1곳 이상 조회된 지역. "이 위치에서 검색" 결과가 없으면 이곳으로 지도를 되돌린다.
  const lastStoreAreaRef = useRef<MapSearchPoint>(defaultMapLocation);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRootRef = useRef<HTMLDivElement>(null);
  const storeListPanelRef = useRef<HTMLDivElement>(null);
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
  // 필터 뱃지 옵션: 지역을 옮길 때마다 순서·구성이 바뀌어 뱃지가 자리를 옮기지 않도록
  // 지금까지 불러온 모든 매장(검색 풀 포함)과 선택 중인 값을 합쳐 가나다순으로 고정한다.
  const consultServiceFilterOptions = useMemo(
    () =>
      toStableServiceOptions(
        [...allStores, ...stores].flatMap(
          (store) => store.consultServices ?? [],
        ),
        consultServiceFilters,
      ),
    [allStores, stores, consultServiceFilters],
  );
  const providedServiceFilterOptions = useMemo(
    () =>
      toStableServiceOptions(
        [...allStores, ...stores].flatMap(
          (store) => store.providedServices ?? [],
        ),
        providedServiceFilters,
      ),
    [allStores, stores, providedServiceFilters],
  );
  const filterStoresByServices = (
    storeRows: StoreLocation[],
    consultFilters: string[] = consultServiceFilters,
    providedFilters: string[] = providedServiceFilters,
  ) =>
    storeRows.filter((store) => {
      const consultServices = store.consultServices ?? [];
      const providedServices = store.providedServices ?? [];
      const matchesConsultService = consultFilters.every((service) =>
        consultServices.includes(service),
      );
      const matchesProvidedService = providedFilters.every((service) =>
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
  /** 매장이 지금 보이는 지도 영역 안에 있는지 (영역 정보가 아직 없으면 반경 기준) */
  const isInVisibleArea = (
    store: Pick<StoreLocation, "lat" | "lng">,
    viewport: MapViewport | null = mapViewport,
  ) => {
    if (!viewport) {
      return getDistanceMeters(searchCenter, store) <= SEARCH_RADIUS_KM * 1000;
    }

    return (
      store.lat >= viewport.southWest.lat &&
      store.lat <= viewport.northEast.lat &&
      store.lng >= viewport.southWest.lng &&
      store.lng <= viewport.northEast.lng
    );
  };
  /**
   * 텍스트 검색 정렬 기준(중심 좌표).
   * 내 위치 버튼·위치 허용 후라면 내 위치, 사용자가 지도를 직접 옮겼다면 보이는 지도 중심.
   */
  const getTextSearchSortCenter = (
    viewport: MapViewport | null = mapViewport,
    anchorSource: "user" | "map" = searchAnchorSource,
  ): MapSearchPoint => {
    const viewportCenter = viewport?.center ?? searchCenter;

    return anchorSource === "user" && userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : viewportCenter;
  };
  const getTextSearchResults = (pool: StoreLocation[]) =>
    pool
      .filter(
        (store) =>
          matchesStoreSearch(store, searchQuery) && isInVisibleArea(store),
      )
      .map((store) => ({
        store,
        distanceMeters: getDistanceMeters(getTextSearchSortCenter(), store),
      }))
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
  // 검색어에서 알아낸 서비스(매장 데이터에 있는 서비스만)
  const availableServiceNames = [
    ...consultServiceFilterOptions.map((option) => option.value),
    ...providedServiceFilterOptions.map((option) => option.value),
  ];
  const searchedServices =
    searchQuery.trim() && !isTagSearchQuery
      ? findServicesInText(searchQuery, availableServiceNames)
      : [];
  const searchResultStores = isTagSearchQuery
    ? textSearchStores
    : filterStoresByServices(textSearchStores);
  // Enter로 검색하면 검색 결과 매장들을 지도 핀·매장 목록에 보여주고, 상단 뱃지로 그 안에서 다시 거른다.
  const unsortedMapStores = submittedSearchStores
    ? filterStoresByServices(submittedSearchStores)
    : hasActiveServiceFilter
      ? categoryDisplayStores
      : categoryStores;
  // 매장 목록·핀 순서(A, B, C…)는 필터 여부와 상관없이 항상 기준 지점에서 가까운 순이다.
  // 기준 지점: Enter 검색 결과면 검색한 순간의 검색 중심, 그 외에는 매장을 조회한 지점.
  // (지도가 움직여 검색 중심이 바뀌어도 순서·거리 표시가 흔들리지 않도록 고정된 지점을 쓴다)
  const storesSortOrigin =
    (submittedSearchStores ? submittedSearchOrigin : null) ??
    storesOrigin ??
    (userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : defaultMapLocation);
  const sortedMapStoreEntries = unsortedMapStores
    .map((store) => ({
      distanceMeters: getDistanceMeters(storesSortOrigin, store),
      store,
    }))
    .sort((first, second) => first.distanceMeters - second.distanceMeters);
  // 목록에 보이는 거리도 같은 기준 지점에서 잰 값으로 맞춰, 순서와 거리 표시가 어긋나지 않게 한다.
  const mapStores = sortedMapStoreEntries.map(({ distanceMeters, store }) => ({
    ...store,
    distanceText: formatDistance(distanceMeters),
  }));
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

  // 첫 페이지(처음 보여주는 핀)는 기준 지점(중심 좌표)에서 가까운 순 12개. 나머지는 12개씩 다음 페이지.
  const firstPageSize = Math.min(STORES_PER_PAGE, mapStores.length);
  const getStorePageRange = (page: number) =>
    page === 0
      ? { end: firstPageSize, start: 0 }
      : {
          end: firstPageSize + page * STORES_PER_PAGE,
          start: firstPageSize + (page - 1) * STORES_PER_PAGE,
        };
  const storePageCount =
    1 +
    Math.max(
      0,
      Math.ceil((mapStores.length - firstPageSize) / STORES_PER_PAGE),
    );
  const currentStorePage = Math.min(storePage, storePageCount - 1);
  const currentStorePageRange = getStorePageRange(currentStorePage);
  const pagedMapStores = mapStores.slice(
    currentStorePageRange.start,
    currentStorePageRange.end,
  );
  const hasMoreStorePages = storePageCount > 1;
  // 다른 페이지에 있는 매장을 골라 카드가 떠 있으면(검색·묶음 핀 등) 그 핀도 함께 보여준다.
  const selectedStoreOutsidePage =
    hasSelectedStoreInfo &&
    selectedStore &&
    !pagedMapStores.some((store) => store.id === selectedStore.id)
      ? selectedStore
      : undefined;
  const markerLabelById: Record<string, string> = Object.fromEntries(
    pagedMapStores.map((store, index) => [store.id, getStoreListLabel(index)]),
  );

  if (selectedStoreOutsidePage) {
    markerLabelById[selectedStoreOutsidePage.id] = "•";
  }
  const goToStorePage = (page: number) => {
    const nextPage = Math.min(Math.max(0, page), storePageCount - 1);
    const nextPageRange = getStorePageRange(nextPage);
    const pageStores = mapStores.slice(nextPageRange.start, nextPageRange.end);

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
        : selectedStoreOutsidePage
          ? [...pagedMapStores, selectedStoreOutsidePage]
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
    options?: { showLoadingCard?: boolean; restoreOnEmpty?: boolean },
  ) => {
    let isCurrentRequest = true;
    // 결과가 없거나 실패하면 기존 매장 핀은 그대로 두고, 직전에 보던 지역으로 지도를 되돌린다.
    const restorePreviousArea = (message: string) => {
      showToast(message);
      setSearchPoint(null);
      setHasSelectedStoreInfo(false);
      setIsWaitingForPinSelection(false);

      // 안내 문구를 읽을 틈을 준 뒤 직전 지역으로 지도를 되돌린다.
      const previousArea = { ...lastStoreAreaRef.current };

      window.setTimeout(() => {
        setFocusPoint(previousArea);
      }, RESTORE_AREA_DELAY_MS);
    };

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
          if (options?.restoreOnEmpty && nearbyStores.length === 0) {
            restorePreviousArea(
              `이 지역 반경 ${SEARCH_RADIUS_KM}km 안에는 매장 정보가 없어요. 직전에 보던 지역으로 돌아갈게요.`,
            );
            return;
          }

          if (nearbyStores.length > 0) {
            lastStoreAreaRef.current = lookupLocation;
          }

          setStoresOrigin(lookupLocation);
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
          if (options?.restoreOnEmpty) {
            restorePreviousArea("매장 정보를 불러오지 못했어요.");
            return;
          }

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

    startTagSearch(nextConsult, nextProvided);
  };
  /**
   * 뱃지(서비스) 태그 검색을 시작하거나 갱신한다.
   * 입력창에 "#서비스"를 넣고, 지금 불러와 둔 매장 안에서 걸러 첫 페이지 핀에 지도를 맞춘다.
   */
  const startTagSearch = (nextConsult: string[], nextProvided: string[]) => {
    const tags = [...nextConsult, ...nextProvided];

    setSearchQuery(tags.map((tag) => `#${tag}`).join(" "));
    setIsSearchHistoryOpen(false);

    // 뱃지를 모두 해제하면 태그 검색 결과를 지우고 원래 매장 목록으로 돌아간다.
    if (tags.length === 0) {
      restorePreTagSearchStores();
      return;
    }

    resetRouteState();
    setHasSelectedStoreInfo(false);
    setSearchPoint(null);

    // 모바일은 목록 패널이 화면을 크게 덮으므로 필터 선택만으로 목록을 펼치지 않는다(지도 핀으로 먼저 확인).
    if (window.innerWidth >= 768) {
      setIsStoreListCollapsed(false);
    }

    // 카테고리(뱃지) 검색: 지금 보이는 지도 영역 기준으로 서버에서 다시 찾고,
    // 보이는 화면 중심에서 가까운 순으로 보여준다. (뱃지 조건은 렌더 시 적용)
    void searchVisibleArea("tag");
  };
  /**
   * 검색어나 채팅에서 알아낸 서비스로 매장을 찾는다(뱃지를 누른 것과 같은 태그 검색).
   * 매장명을 모르는 사용자가 "요금 수납", "유심" 처럼 하려는 일로 찾을 수 있게 한다.
   */
  const applyServiceFilterSearch = (services: string[]) => {
    const nextConsult = services.filter((service) =>
      consultServiceFilterOptions.some((option) => option.value === service),
    );
    const nextProvided = services.filter((service) =>
      providedServiceFilterOptions.some((option) => option.value === service),
    );

    if (nextConsult.length === 0 && nextProvided.length === 0) {
      return false;
    }

    // 텍스트 검색 중이었다면 정리하고 태그 검색으로 전환한다.
    if (searchQuery.trim() && !isTagSearchQuery) {
      clearTextSearchSession();
    }

    setSubmittedSearchStores(null);
    setConsultServiceFilters(nextConsult);
    setProvidedServiceFilters(nextProvided);
    startTagSearch(nextConsult, nextProvided);

    return true;
  };
  /** 태그(뱃지) 검색 결과를 지우고 원래 매장 목록(지도에 불러와 둔 매장)으로 돌아간다. */
  const restorePreTagSearchStores = () => {
    setSubmittedSearchStores(null);
    setHasSelectedStoreInfo(false);

    return true;
  };
  /** 지금 보이는 지도 영역을 덮는 조회 중심·반경(km). 반경은 화면 중심→모서리 거리, 최대 3km. */
  const getVisibleAreaQuery = (viewport: MapViewport | null = mapViewport) => {
    if (!viewport) {
      return { center: searchCenter, radiusKm: SEARCH_RADIUS_KM };
    }

    const halfDiagonalKm =
      getDistanceMeters(viewport.center, viewport.northEast) / 1000;

    return {
      center: viewport.center,
      radiusKm: Math.min(
        MAX_VIEWPORT_SEARCH_RADIUS_KM,
        Math.max(0.3, Number(halfDiagonalKm.toFixed(2))),
      ),
    };
  };
  /**
   * 보이는 지도 영역 기준 검색.
   * - text: 검색어에 맞는 매장을 영역 안에서 찾고, 중심 좌표(내 위치 또는 지도 중심)에서 가까운 순
   * - tag : 영역 안 매장을 모두 가져오고(뱃지 조건은 렌더 시 적용), 보이는 화면 중심에서 가까운 순
   * 결과는 검색 결과(submittedSearchStores)로만 보여주고, 원래 매장 목록(stores)은 건드리지 않는다.
   */
  const searchVisibleArea = async (
    mode: "text" | "tag",
    {
      anchorSource = searchAnchorSource,
      query = searchQuery,
      viewport = mapViewport,
    }: {
      anchorSource?: "user" | "map";
      query?: string;
      viewport?: MapViewport | null;
    } = {},
  ) => {
    const { center, radiusKm } = getVisibleAreaQuery(viewport);

    try {
      const areaStores = await storeService.fetchNearbyStores(center, radiusKm);

      // 입력 중 드롭다운 검색에도 쓰도록 검색용 매장 풀에 합쳐 둔다.
      mergeSearchStores(areaStores);

      const visibleStores = areaStores.filter((store) =>
        isInVisibleArea(store, viewport),
      );
      const results =
        mode === "text"
          ? visibleStores.filter((store) => matchesStoreSearch(store, query))
          : visibleStores;

      setSubmittedSearchOrigin(
        mode === "text"
          ? getTextSearchSortCenter(viewport, anchorSource)
          : center,
      );
      setSubmittedSearchStores(results);

      return results;
    } catch {
      showToast("매장 정보를 불러오지 못했어요.");
      return null;
    }
  };
  /** 지도 이동·확대/축소가 끝날 때: 보이는 영역을 기억하고, 텍스트 검색 중 사용자가 지도를 옮겼으면 자동 재검색 */
  const handleViewportChange = (viewport: MapViewport) => {
    // 지도를 옮겨도 자동으로 다시 검색하지 않는다(화면만 둘러보려는 사용자를 헷갈리게 하지 않도록).
    // 다시 찾기는 "이 위치에서 검색" 버튼으로만 한다(searchInCurrentArea).
    setMapViewport(viewport);
    updateMapCenter(viewport.center);
  };
  /**
   * "이 위치에서 검색" 버튼: 지금 보이는 지도 영역에서 다시 찾는다.
   * - 텍스트 검색 중: 검색어·뱃지를 유지한 채 옮긴 영역에서 검색어로 다시 찾음(정렬 중심은 옮긴 지도 중심)
   * - 뱃지(카테고리) 검색 중: 선택한 뱃지를 유지한 채 옮긴 영역에서 다시 찾음(정렬 중심은 화면 중심)
   * - 검색 없음: 옮긴 지점 주변 매장을 새로 불러옴(결과가 없으면 직전 지역으로 복귀)
   */
  const searchInCurrentArea = async () => {
    if (!searchPoint) {
      return;
    }

    const areaPoint = searchPoint;
    const isTextSearch = Boolean(searchQuery.trim()) && !isTagSearchQuery;
    const isCategorySearch = isTagSearchQuery && hasActiveServiceFilter;

    // 길찾기 중에 재검색하면 경로를 끝내고 새 지역 매장을 보여준다.
    // (길찾기 중에는 도착 매장 핀만 보이므로, 끝내지 않으면 새로 불러온 매장이 지도에 보이지 않는다)
    if (routeDestinationStoreId) {
      resetRouteState();
    }

    // 검색을 시작하면 "이 위치에서 검색" 대기 상태를 끝낸다.
    setSearchPoint(null);
    setSoloStoreId("");
    setHasSelectedStoreInfo(false);

    if (isTextSearch) {
      const results = await searchVisibleArea("text", { anchorSource: "map" });

      if (results && results.length === 0) {
        showToast("이 지역에는 검색 결과가 없어요.");
      }
      return;
    }

    if (isCategorySearch) {
      const results = await searchVisibleArea("tag");
      const hasFilteredResult = results
        ? filterStoresByServices(results).length > 0
        : true;

      if (!hasFilteredResult) {
        showToast("이 지역에는 선택한 서비스를 제공하는 매장이 없어요.");
      }
      return;
    }

    updateStoresByLocation(areaPoint, {
      restoreOnEmpty: true,
      showLoadingCard: true,
    });
  };
  /** Enter 또는 검색 아이콘: 지금 보이는 지도 영역에서 찾은 검색 결과를 지도 핀·목록에 모두 보여준다. */
  const submitStoreSearch = async () => {
    setIsSearchHistoryOpen(false);

    if (isTagSearchQuery || !searchQuery.trim()) {
      return;
    }

    addSearchHistory(searchQuery);

    // 검색어가 하려는 일(서비스)을 뜻하면 매장명 검색보다 서비스 검색을 우선한다.
    if (
      searchedServices.length > 0 &&
      applyServiceFilterSearch(searchedServices)
    ) {
      searchInputRef.current?.blur();
      return;
    }

    resetRouteState();
    setSoloStoreId("");
    setHasSelectedStoreInfo(false);
    setSearchPoint(null);

    // 텍스트 검색: 지금 보이는 지도 영역에서 찾고, 중심 좌표(내 위치 또는 지도 중심)에서 가까운 순으로 보여준다.
    const results = await searchVisibleArea("text");

    if (results && results.length === 0) {
      showToast("지금 보이는 지도 영역에 검색 결과가 없어요.");
    }

    // 모바일은 목록 패널이 화면을 크게 덮으므로 검색 결과도 지도 핀으로 먼저 보여주고, 목록은 사용자가 직접 펼친다.
    if (window.innerWidth >= 768) {
      setIsStoreListCollapsed(false);
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

    // 태그 검색에서 해제한 경우: 태그 검색 결과만 지우고 원래 매장 목록으로 돌아간다.
    if (isTagSearchQuery) {
      return;
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

      // 텍스트 검색 중에 골라 매장 묶음에 새로 들어간 매장은 기록해 두었다가 검색을 지울 때 뺀다.
      if (searchQuery.trim() && !isTagSearchQuery) {
        searchAddedStoreIdsRef.current.add(nextStore.id);
      }
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
            // 위에서 추가했던 매장이 그사이(검색 지우기 등) 빠졌다면 다시 넣지 않는다.
            return nextStore ? prevStores : [...prevStores, storeDetail];
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

    // 모바일은 화면이 좁아 카드가 경로를 가리므로 기본으로 닫아 둔다(도착 핀을 누르면 다시 열림).
    if (window.innerWidth < 768) {
      setHasSelectedStoreInfo(false);
    }

    if (userLocation) {
      watchLocation();
      return;
    }

    // 위치가 아직 없을 때: 권한이 이미 있으면 바로 추적하고, 아직 묻지 않았으면 모달만 띄운다.
    // (모달과 브라우저 권한 팝업이 동시에 뜨지 않도록 모달 동의 후에 추적을 시작한다.)
    void getGeolocationPermissionState().then((permissionState) => {
      if (permissionState === "denied") {
        resetRouteState();
        showToast(
          "브라우저 설정에서 위치 권한을 허용하면 경로를 볼 수 있어요.",
        );
        return;
      }

      if (
        permissionState === "granted" ||
        (permissionState === null &&
          readStorage("local", LOCATION_CONSENT_STORAGE_KEY) === "granted")
      ) {
        watchLocation();
        showToast("현재 위치를 확인한 뒤 경로를 표시할게요.");
        return;
      }

      setIsLocationPermissionModalOpen(true);
    });
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
    // 내 위치로 이동: 이후 텍스트 검색 정렬 중심은 내 위치
    setSearchAnchorSource("user");

    // 길찾기 중이면 위치 추적(watch)만, 아니면 한 번 조회만 한다. (동시에 두 번 요청하지 않도록)
    if (!routeDestinationStoreId) {
      requestLocation();
    }

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
          .then((nearbyStores) => {
            setStoresOrigin({ lat: userLocation.lat, lng: userLocation.lng });
            setStores(nearbyStores);
          })
          .catch(() => {
            showToast("주변 매장을 불러오지 못했어요.");
          });
      }
    }

    if (routeDestinationStoreId) {
      watchLocation();
    }
  };
  /**
   * VITA map 버튼: 길찾기·검색·필터를 모두 초기화하고 내 위치 기준 주변 매장을 보여준다.
   * 위치가 아직 없으면 권한 상태에 맞춰 위치를 요청한다(허용됨 → 바로 조회, 미결정 → 모달, 차단 → 안내).
   */
  /**
   * 텍스트 검색을 지울 때 검색 중에 쌓인 데이터를 정리한다.
   * - 검색 결과에서 골라 매장 묶음(stores)에 추가된 매장을 뺀다(원래 조회 지역 목록으로 복원)
   * - 검색용 매장 풀(allStores)을 비운다(다음 검색 때 그 지역을 다시 불러온다)
   */
  const clearTextSearchSession = () => {
    const addedStoreIds = new Set(searchAddedStoreIdsRef.current);

    searchAddedStoreIdsRef.current.clear();
    setAllStores([]);
    loadedSearchAreaKeyRef.current = "";

    if (addedStoreIds.size === 0) {
      return;
    }

    setStores((prevStores) =>
      prevStores.filter((store) => !addedStoreIds.has(store.id)),
    );

    // 빠지는 매장의 카드가 떠 있으면 닫는다.
    if (mapSelectedStore && addedStoreIds.has(mapSelectedStore.id)) {
      setHasSelectedStoreInfo(false);
      setSoloStoreId("");
    }
  };
  const showStoresFromUserLocation = () => {
    setSearchAnchorSource("user");
    resetRouteState();
    setActiveMapCategory("store");
    setSearchQuery("");
    setIsSearchHistoryOpen(false);
    setSubmittedSearchStores(null);
    clearTextSearchSession();
    setConsultServiceFilters([]);
    setProvidedServiceFilters([]);
    setSoloStoreId("");
    setHasSelectedStoreInfo(false);
    setIsWaitingForPinSelection(false);
    setSelectedStoreId("");
    setSearchPoint(null);
    // 처음 화면으로 돌아가면 바로 검색할 수 있도록 검색창에 포커스
    searchInputRef.current?.focus();

    if (userLocation) {
      const currentPoint = { lat: userLocation.lat, lng: userLocation.lng };

      hasFocusedInitialLocationRef.current = true;
      shouldFocusUserLocationRef.current = false;
      setFocusPoint(currentPoint);
      updateStoresByLocation(currentPoint);
      return;
    }

    void getGeolocationPermissionState().then((permissionState) => {
      if (permissionState === "denied") {
        showToast(
          "브라우저 설정에서 위치 권한을 허용하면 내 위치 주변 매장을 볼 수 있어요.",
        );
        return;
      }

      if (
        permissionState === "granted" ||
        (permissionState === null &&
          readStorage("local", LOCATION_CONSENT_STORAGE_KEY) === "granted")
      ) {
        focusUserLocation();
        return;
      }

      setIsLocationPermissionModalOpen(true);
    });
  };
  const requestUserLocationFromModal = () => {
    setIsLocationPermissionModalOpen(false);
    writeStorage("local", LOCATION_CONSENT_STORAGE_KEY, "granted");
    focusUserLocation();
  };
  /**
   * 위치 허용 모달 "나중에"/닫기:
   * - 이번 세션 동안은 모달을 다시 띄우지 않는다.
   * - 위치 없이 기본 위치 주변 매장을 보여주고(진입 시 이미 조회됨), 나중에 켜는 방법을 안내한다.
   * - 이후 "내 위치" 버튼이나 길찾기에서 위치가 필요하면 그때 다시 묻는다.
   */
  const dismissLocationPermissionModal = () => {
    setIsLocationPermissionModalOpen(false);
    writeStorage("session", LOCATION_MODAL_DISMISSED_STORAGE_KEY, "true");

    if (userLocation) {
      return;
    }

    // 길찾기 시작 중에 "나중에"를 누르면 위치 없이 경로를 계산할 수 없으므로 길찾기를 취소한다.
    // (취소하지 않으면 "이동 경로 탐색 중" 오버레이가 계속 떠 있게 된다.)
    if (routeDestinationStoreId) {
      resetRouteState();
      showToast("위치를 허용해야 경로를 볼 수 있어요.");
      return;
    }

    showToast(
      "기본 위치 주변 매장을 보여드릴게요. 내 위치 버튼으로 언제든 위치를 켤 수 있어요.",
    );
  };

  // 진입 시 위치 권한 확인:
  // - 이미 허용됨(또는 이전에 모달에서 허용) → 모달 없이 바로 내 위치 조회
  // - 차단됨 / 이번 세션에 "나중에" 선택 → 모달 띄우지 않음
  // - 아직 묻지 않음 → 모달 표시
  useEffect(() => {
    let isCancelled = false;

    void getGeolocationPermissionState().then((permissionState) => {
      if (isCancelled) {
        return;
      }

      const hasConsented =
        readStorage("local", LOCATION_CONSENT_STORAGE_KEY) === "granted";

      if (
        permissionState === "granted" ||
        (permissionState === null && hasConsented)
      ) {
        shouldFocusUserLocationRef.current = true;
        requestLocation();
        return;
      }

      if (
        permissionState === "denied" ||
        readStorage("session", LOCATION_MODAL_DISMISSED_STORAGE_KEY) === "true"
      ) {
        return;
      }

      setIsLocationPermissionModalOpen(true);
    });

    return () => {
      isCancelled = true;
    };
  }, [requestLocation]);

  // 위치 요청이 차단되면 이유를 알려준다.
  useEffect(() => {
    if (locationStatus === "denied") {
      showToast("브라우저 설정에서 위치 권한을 허용해 주세요.");
    }
  }, [locationStatus]);
  const mapSelectedStore = categorySelectedStore ?? routeDestinationStore;
  const mapSelectedStoreId =
    categorySelectedStore?.id ?? routeDestinationStore?.id ?? "";
  // 선택 매장과 같은 좌표(소수 5자리, 지도 묶음 핀과 같은 기준)에 있는 매장들
  const getCoordinateKey = (store: Pick<StoreLocation, "lat" | "lng">) =>
    `${store.lat.toFixed(5)}:${store.lng.toFixed(5)}`;
  const sameLocationStores = mapSelectedStore
    ? (mapStores.some((store) => store.id === mapSelectedStore.id)
        ? mapStores
        : stores
      ).filter(
        (store) =>
          getCoordinateKey(store) === getCoordinateKey(mapSelectedStore),
      )
    : [];
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
          .then((nearbyStores) => {
            setStoresOrigin({ lat, lng });
            setStores(nearbyStores);
          })
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
    let isSettled = false;

    storeService
      .fetchNearbyStores(nearbyLookup.location)
      .then((nearbyStores) => {
        isSettled = true;

        if (isCurrentRequest) {
          if (nearbyStores.length > 0) {
            lastStoreAreaRef.current = nearbyLookup.location;
          }

          setStoresOrigin(nearbyLookup.location);
          setStores(nearbyStores);
        }
      })
      .catch(() => {
        isSettled = true;

        if (isCurrentRequest) {
          setStores([]);
        }
      });

    return () => {
      isCurrentRequest = false;

      // 응답 전에 취소되면(개발 모드 StrictMode의 effect 재실행 등) 같은 지점을 다시 조회할 수 있게 기록을 지운다.
      // 지우지 않으면 재실행된 effect가 "이미 조회함"으로 보고 건너뛰어 매장이 하나도 안 뜬다.
      if (!isSettled) {
        lastNearbyLookupKeyRef.current = "";
      }
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
      const { center, radiusKm } = getVisibleAreaQuery();
      const areaStores = await storeService.fetchNearbyStores(center, radiusKm);

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
              sameLocationStores={sameLocationStores}
              onSelectSameLocationStore={(storeId) =>
                handleStoreSelect(storeId, {
                  showOnlySelected: Boolean(soloStoreId),
                })
              }
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
        getRouteObstacleRect={() =>
          isStoreListCollapsed
            ? null
            : (storeListPanelRef.current?.getBoundingClientRect() ?? null)
        }
        // 길찾기 중 확대 등으로 경로·출발/도착·카드가 매장 목록 패널에 가리면 목록을 자동으로 접는다.
        onRouteObstructed={() => setIsStoreListCollapsed(true)}
        searchPoint={searchPoint}
        userLocation={userLocation}
        isUserLocationLoading={locationStatus === "requesting"}
        onFocusUserLocation={focusUserLocation}
        onMapPointSelect={(point) => {
          setSearchPoint(point);
          // 사용자가 지도를 직접 옮김: 이후 텍스트 검색 정렬 중심은 보이는 지도 중심
          setSearchAnchorSource("map");
        }}
        onViewportChange={handleViewportChange}
        onSelectedStoreCardClose={closeSelectedStoreInfo}
        onSearchFromMapPoint={() => {
          void searchInCurrentArea();
        }}
        onSelectStore={handleStoreSelect}
      />

      <div className="pointer-events-none absolute inset-0 z-10 pt-16 md:pt-0">
        <div className="pointer-events-auto absolute top-3 right-3 left-3 flex flex-col gap-3 md:top-5 md:right-5 md:left-5 md:flex-row md:flex-wrap md:items-start">
          <div className="flex min-w-0 flex-col gap-3 md:flex-1 md:flex-row md:flex-nowrap md:items-start">
            <div
              ref={collapsedSearchRef}
              className="relative w-[min(420px,calc(100vw-48px))] max-w-full min-w-0 shrink-0 self-center sm:self-start md:w-[clamp(320px,30vw,440px)]"
            >
              <div className="relative z-30 flex h-12 items-center rounded-sm bg-white text-left shadow-sm dark:bg-zinc-950">
                {/* 좌측 VITA map 버튼: 길찾기·검색을 초기화하고 내 위치 기준 매장을 보여준다 */}
                <div className="bg-brand flex h-full w-[132px] shrink-0 items-center overflow-hidden rounded-l-sm text-white md:w-[116px]">
                  {onOpenSidebar && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenSidebar();
                      }}
                      className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition hover:bg-white/15 md:hidden"
                      aria-label="사이드바 열기"
                    >
                      <Menu size={20} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={showStoresFromUserLocation}
                    className="hover:bg-brand-hover flex h-full min-w-0 flex-1 items-center justify-center px-2 text-sm font-extrabold whitespace-nowrap transition md:px-0"
                    aria-label="길찾기 초기화하고 내 위치 기준 매장 보기"
                    title="내 위치 기준 매장 보기"
                  >
                    VITA map
                  </button>
                </div>
                <label className="flex h-full min-w-0 flex-1 items-center justify-between gap-3 bg-white px-3.5 text-sm font-semibold text-gray-400 dark:bg-zinc-950">
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => {
                      const nextQuery = event.target.value;

                      // 태그 검색어를 모두 지우면 뱃지 필터도 함께 해제한다.
                      if (isTagSearchQuery && !nextQuery.trim()) {
                        setConsultServiceFilters([]);
                        setProvidedServiceFilters([]);
                        restorePreTagSearchStores();
                      }

                      // 텍스트 검색어를 모두 지우면 검색 중에 쌓인 데이터를 정리한다.
                      if (
                        !isTagSearchQuery &&
                        searchQuery.trim() &&
                        !nextQuery.trim()
                      ) {
                        clearTextSearchSession();
                      }

                      // 검색 풀을 비운 뒤 다시 입력하면 현재 지역 매장을 다시 불러온다(이미 불러왔으면 건너뜀).
                      if (
                        nextQuery.trim() &&
                        !nextQuery.trim().startsWith("#")
                      ) {
                        void loadSearchAreaStores();
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
                    {/* 지도에 찍힌 핀(현재 페이지) 개수 기준. 전체가 더 많으면 "현재/전체"로 표시 */}
                    {activeMapCategory === "store"
                      ? hasMoreStorePages
                        ? `${pagedMapStores.length}/${mapStores.length}`
                        : `${mapStores.length}개`
                      : `${benefitServicePreviewItems.length}개`}
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
                      {/* 서비스로 찾기: 매장명보다 하려는 일로 찾는 경우를 위해 맨 위에 보여준다 */}
                      {searchedServices.map((service) => {
                        const ServiceIcon = getServiceFilterIcon(service);

                        return (
                          <button
                            key={`service-${service}`}
                            type="button"
                            onClick={() => {
                              addSearchHistory(searchQuery);
                              applyServiceFilterSearch([service]);
                            }}
                            className="flex h-11 w-full items-center gap-3 px-5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                          >
                            <span className="bg-brand-soft text-brand dark:bg-brand/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                              <ServiceIcon size={13} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {service} 가능한 매장 찾기
                            </span>
                            <span className="text-brand shrink-0 text-[11px] font-extrabold">
                              서비스
                            </span>
                          </button>
                        );
                      })}
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

                      {searchResultStores.length === 0 &&
                        searchedServices.length === 0 && (
                          <div className="flex h-14 cursor-default items-center justify-center text-sm font-medium text-gray-400/85">
                            지금 보이는 지도 영역에 검색 결과가 없어요.
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
                <div
                  ref={storeListPanelRef}
                  className="absolute top-12 left-0 z-10 w-full overflow-hidden rounded-b-sm bg-white/95 shadow-sm backdrop-blur dark:bg-zinc-950/95"
                >
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
                              ({mapStores.length - firstPageSize}개 더)
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
            {/* 모바일: 검색창 바로 아래 가로 슬라이드 필터 */}
            <div className="-mx-3 w-[calc(100%+24px)] max-w-none min-w-0 self-stretch sm:mx-0 sm:w-[min(420px,calc(100vw-48px))] sm:max-w-full sm:self-start md:hidden">
              <MobileServiceFilterCarousel
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
        onClose={dismissLocationPermissionModal}
        title="내 위치를 사용할까요?"
        description="현재 위치 주변의 VITA 매장을 지도에서 바로 확인할 수 있어요."
        size="sm"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={dismissLocationPermissionModal}
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
          reservationStore ? (
            <>
              <span className="text-text-primary font-bold">
                {reservationStore.name}
              </span>
              <br />
              방문 예약을 진행할까요?
            </>
          ) : undefined
        }
        size="sm"
        // 한국어가 글자 단위로 끊기지 않도록 단어 단위 줄바꿈
        className="break-keep"
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
        예약 후 매장 방문 전에
        <br />
        운영시간과 상담 가능 서비스를 한 번 더 확인해 주세요.
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
