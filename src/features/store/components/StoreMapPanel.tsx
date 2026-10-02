"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgePercent,
  Bike,
  Bus,
  CalendarCheck,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Clock3,
  CornerUpRight,
  List,
  MapPinned,
  Menu,
  Search,
  SportShoe,
  Store,
  X,
} from "lucide-react";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import {
  getServiceFilterIcon,
  MobileServiceFilterCarousel,
  ServiceFilterCarousel,
} from "@/features/store/components/StoreServiceFilterCarousel";
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
import {
  buildMarkerColorInfoById,
  buildServiceFilterColorByValue,
} from "@/features/store/lib/markerColors";
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

type RouteSummary = {
  isLoading?: boolean;
  /** 가까운 매장인데 차량·자전거 경로가 크게 돌아가 도보를 추천하는지 */
  isWalkRecommended?: boolean;
  remainingDistanceText: string;
  travelTimeText: string;
};

/** 이 직선거리(m) 안의 매장은 차량·자전거 경로가 크게 돌아가면 도보를 추천한다. */
const WALK_RECOMMEND_MAX_STRAIGHT_METERS = 300;
/** 경로 거리가 직선거리의 이 배수 이상이면 "크게 돌아간다"고 본다(일방통행·유턴 등). */
const WALK_RECOMMEND_DETOUR_RATIO = 2;

/** 텍스트 검색 반경(km). 주변 매장 조회 반경(storeService)과 같다. */
const SEARCH_RADIUS_KM = 1.5;
/** 지도 핀(A~L)·매장 목록 한 페이지에 보여줄 매장 수. */
const STORES_PER_PAGE = 12;
/** 페이지 이동 시 지도가 먼저 움직이기 시작한 뒤 핀·목록을 바꾸기까지의 텀(ms) */
const STORE_PAGE_SWITCH_DELAY_MS = 260;
/** 마지막 필터 해제 후 매장을 다시 불러오는 동안 지도를 자동으로 옮기지 않는 시간(ms) */
const PIN_AUTO_FIT_SKIP_MS = 2500;

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

const toStableServiceOptions = (services: string[], selected: string[]) =>
  Array.from(new Set([...services, ...selected]))
    .sort((first, second) => first.localeCompare(second, "ko"))
    .map((service) => ({ label: service, value: service }));

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
          <>
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
            {/* 가까운 매장인데 차량·자전거 경로가 크게 돌아가면 도보 길찾기를 권한다. */}
            {!routeSummary.isLoading && routeSummary.isWalkRecommended && (
              <div className="text-text-secondary mt-2 flex items-center justify-between gap-2 rounded-sm bg-gray-100 py-1.5 pr-1.5 pl-3 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300">
                <span>가까운 거리라 도보 이동을 추천해요</span>
                <button
                  type="button"
                  onClick={() => onRouteModeChange("walk")}
                  className="text-brand-hover dark:text-brand flex shrink-0 items-center gap-1 rounded-sm bg-white px-2 py-1 font-extrabold shadow-sm transition hover:shadow-md dark:bg-zinc-950"
                >
                  <SportShoe size={12} />
                  도보로 보기
                </button>
              </div>
            )}
          </>
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

// 지도 화면은 검색, 필터, 위치, 길찾기 상태가 강하게 맞물린다.
// 새 상태를 추가할 때는 useStoreMapState로 먼저 분리할 수 있는지 확인한다.
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
  // 핀(현재 페이지 12곳) 외 나머지 매장 위치를 반투명 원으로 함께 보여줄지
  const [isOtherStoresVisible, setIsOtherStoresVisible] = useState(false);
  // 페이지 버튼을 누른 뒤 실제로 핀·목록이 바뀌기 전까지 이동할 페이지(번호 강조는 바로 바꾼다)
  const [pendingStorePage, setPendingStorePage] = useState<number | null>(null);
  const storePageSwitchTimeoutRef = useRef<number | undefined>(undefined);
  const latestMapStoresKeyRef = useRef("");

  useEffect(
    () => () => {
      window.clearTimeout(storePageSwitchTimeoutRef.current);
    },
    [],
  );
  const [storePageSourceKey, setStorePageSourceKey] = useState("");
  const [submittedSearchOrigin, setSubmittedSearchOrigin] =
    useState<MapSearchPoint | null>(null);
  const [submittedSearchStores, setSubmittedSearchStores] = useState<
    StoreLocation[] | null
  >(null);
  const [searchFitTarget, setSearchFitTarget] = useState<{
    key: string;
    points: MapSearchPoint[];
    smooth?: boolean;
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
  // 지도 영역 검색(searchVisibleArea) 요청 번호. 가장 최근 요청의 응답만 화면에 반영한다.
  const areaSearchRequestIdRef = useRef(0);
  // true인 동안 핀 자동 맞춤(지도 이동)을 하지 않는다. 필터 해제 직후 보던 화면을 그대로 두기 위해 쓴다.
  const isPinAutoFitSkippedRef = useRef(false);
  const pinAutoFitSkipTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(pinAutoFitSkipTimeoutRef.current);
    },
    [],
  );
  // 뱃지(필터) 검색 중 사용자가 지도를 끌어 옮겼다: 이동이 끝나면(idle) 보이는 영역에서 다시 찾는다.
  const shouldRefreshTagSearchOnIdleRef = useRef(false);
  const shouldFocusUserLocationRef = useRef(false);
  // 마지막으로 매장이 1곳 이상 조회된 지역. "이 위치에서 검색" 결과가 없으면 이곳으로 지도를 되돌린다.
  const lastStoreAreaRef = useRef<MapSearchPoint>(defaultMapLocation);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRootRef = useRef<HTMLDivElement>(null);
  const storeListPanelRef = useRef<HTMLDivElement>(null);
  // 지도 위 상단 영역(검색창 + 필터 뱃지 줄). 핀이 이 아래로 꽂히도록 높이를 잰다.
  const mapTopBarRef = useRef<HTMLDivElement>(null);
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
  // 출발-경로-도착이 보이도록 지도 범위 맞춤이 끝난 경로 key(이 전까지는 탐색 중 모달을 유지)
  const [routeMapReadyKey, setRouteMapReadyKey] = useState("");
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
  const serviceFilterColorByValue = useMemo(
    () =>
      buildServiceFilterColorByValue([
        ...consultServiceFilterOptions,
        ...providedServiceFilterOptions,
      ]),
    [consultServiceFilterOptions, providedServiceFilterOptions],
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
    setPendingStorePage(null);
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
  const activeServiceFilters = [
    ...consultServiceFilters,
    ...providedServiceFilters,
  ];
  const markerColorInfoById = buildMarkerColorInfoById({
    activeServiceFilters,
    colorByValue: serviceFilterColorByValue,
    stores: mapStores,
  });

  if (selectedStoreOutsidePage) {
    markerLabelById[selectedStoreOutsidePage.id] = "•";
  }
  useEffect(() => {
    latestMapStoresKeyRef.current = mapStoresKey;
  }, [mapStoresKey]);
  // 페이지 버튼 강조·이전/다음 기준은 바뀔 예정인 페이지를 먼저 따른다.
  const activeStorePage = Math.min(
    pendingStorePage ?? currentStorePage,
    storePageCount - 1,
  );
  /**
   * 페이지 이동: 지도를 먼저 부드럽게 옮기기 시작하고, 잠깐(텀) 뒤에 핀·목록을 새 페이지로 바꾼다.
   * 새 핀·목록은 서서히 나타난다. 연달아 누르면 마지막으로 누른 페이지만 반영한다.
   */
  const goToStorePage = (page: number) => {
    const nextPage = Math.min(Math.max(0, page), storePageCount - 1);
    const nextPageRange = getStorePageRange(nextPage);
    const pageStores = mapStores.slice(nextPageRange.start, nextPageRange.end);
    const sourceKey = mapStoresKey;

    setPendingStorePage(nextPage);
    setSoloStoreId("");
    setHasSelectedStoreInfo(false);

    // 페이지를 넘기면 그 페이지 매장 핀(A~L)이 모두 보이도록 지도를 부드럽게 옮긴다.
    if (pageStores.length > 0) {
      setSearchFitTarget({
        key: `page:${mapStoresKey}:${nextPage}`,
        points: pageStores.map((store) => ({ lat: store.lat, lng: store.lng })),
        smooth: true,
      });
    }

    window.clearTimeout(storePageSwitchTimeoutRef.current);
    storePageSwitchTimeoutRef.current = window.setTimeout(() => {
      setPendingStorePage(null);

      // 그사이 매장 목록 자체가 바뀌었으면(새 검색 등) 이전 목록 기준 페이지는 적용하지 않는다.
      if (latestMapStoresKeyRef.current === sourceKey) {
        setStorePage(nextPage);
      }
    }, STORE_PAGE_SWITCH_DELAY_MS);
  };
  const visibleMapStores =
    routeDestinationStoreId && routeDestinationStore
      ? [routeDestinationStore]
      : soloStore
        ? [soloStore]
        : selectedStoreOutsidePage
          ? [...pagedMapStores, selectedStoreOutsidePage]
          : pagedMapStores;
  // 목록에는 있지만 지금 핀으로 보이지 않는 매장(다른 페이지). 길찾기·단독 표시 중에는 보여주지 않는다.
  const visibleMapStoreIds = new Set(visibleMapStores.map((store) => store.id));
  const otherMapStores =
    (routeDestinationStoreId && routeDestinationStore) || soloStore
      ? []
      : mapStores.filter((store) => !visibleMapStoreIds.has(store.id));
  const routeSummary = (() => {
    if (!userLocation || !routeDestinationStore) {
      return null;
    }

    const straightDistanceMeters = getDistanceMeters(
      userLocation,
      routeDestinationStore,
    );
    const remainingDistanceMeters =
      walkingRoute?.distanceMeters ?? straightDistanceMeters;
    // 가까운 매장이라도 차량·자전거는 일방통행·유턴 등으로 크게 돌아가는 경로가 나올 수 있다.
    // 경로는 그대로 보여주되, 이런 경우 도보 길찾기를 함께 권한다.
    const isWalkRecommended =
      (routeMode === "car" || routeMode === "bicycle") &&
      Boolean(walkingRoute) &&
      straightDistanceMeters < WALK_RECOMMEND_MAX_STRAIGHT_METERS &&
      remainingDistanceMeters >=
        straightDistanceMeters * WALK_RECOMMEND_DETOUR_RATIO;

    return {
      isLoading: isRouteLoading,
      isWalkRecommended,
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
  // 경로 응답을 받은 뒤에도 지도 범위를 맞추는 동안에는 탐색 중 모달을 유지한다.
  const isRouteMapPreparing = Boolean(
    routePreview && routeMapReadyKey !== routePreview.routeKey,
  );
  const isRouteSearchOverlayVisible =
    (isRouteLoading || isRouteMapPreparing) &&
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

    // 새 지역을 조회하면 이전 Enter 검색 결과 표시는 해제한다(진행 중인 영역 검색 응답도 무효화).
    areaSearchRequestIdRef.current += 1;
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
   * 이미 태그 검색 결과가 있으면 서버를 다시 조회하지 않고 그 결과 안에서 뱃지 조건으로만 다시 거른다.
   * (뱃지를 더할수록 결과가 줄기만 하도록. 다른 지역 조회는 "이 위치에서 검색" 버튼으로만 한다)
   */
  const startTagSearch = (
    nextConsult: string[],
    nextProvided: string[],
    { forceFetch = false }: { forceFetch?: boolean } = {},
  ) => {
    const tags = [...nextConsult, ...nextProvided];

    setSearchQuery(tags.map((tag) => `#${tag}`).join(" "));
    setIsSearchHistoryOpen(false);

    // 마지막 뱃지를 해제하면 태그 검색 결과를 지우되, 지도는 내 위치로 돌아가지 않고 보던 화면을 유지한다.
    // 그 화면의 매장(필터 없이)을 불러와, 사용자가 그 지역에서 다시 검색하거나 뱃지를 고를 수 있게 한다.
    if (tags.length === 0) {
      restorePreTagSearchStores();
      isPinAutoFitSkippedRef.current = true;
      window.clearTimeout(pinAutoFitSkipTimeoutRef.current);
      pinAutoFitSkipTimeoutRef.current = window.setTimeout(() => {
        isPinAutoFitSkippedRef.current = false;
      }, PIN_AUTO_FIT_SKIP_MS);
      updateStoresByLocation(mapViewport?.center ?? searchCenter);
      return;
    }

    resetRouteState();
    setHasSelectedStoreInfo(false);

    // 모바일은 목록 패널이 화면을 크게 덮으므로 필터 선택만으로 목록을 펼치지 않는다(지도 핀으로 먼저 확인).
    if (window.innerWidth >= 768) {
      setIsStoreListCollapsed(false);
    }

    // 이미 불러온 태그 검색 결과가 있으면 재조회 없이 렌더 시 뱃지 조건으로만 다시 거른다.
    // 지도를 옮겨 둔 상태라면 "이 위치에서 검색" 버튼(searchPoint)은 그대로 남겨 둔다.
    if (!forceFetch && isTagSearchQuery && submittedSearchStores) {
      return;
    }

    setSearchPoint(null);

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
    startTagSearch(nextConsult, nextProvided, { forceFetch: true });

    return true;
  };
  /** 태그(뱃지) 검색 결과를 지우고 원래 매장 목록(지도에 불러와 둔 매장)으로 돌아간다. */
  const restorePreTagSearchStores = () => {
    // 아직 오지 않은 영역 검색 응답이 해제한 결과를 다시 띄우지 않도록 무효화한다.
    areaSearchRequestIdRef.current += 1;
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
    const requestId = ++areaSearchRequestIdRef.current;

    try {
      const areaStores = await storeService.fetchNearbyStores(center, radiusKm);

      // 그 사이 새 검색이 시작됐거나 결과가 해제됐으면 늦게 도착한 이 응답은 버린다.
      if (requestId !== areaSearchRequestIdRef.current) {
        return null;
      }

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
      if (requestId === areaSearchRequestIdRef.current) {
        showToast("매장 정보를 불러오지 못했어요.");
      }
      return null;
    }
  };
  /** 지도 이동·확대/축소가 끝날 때: 보이는 영역을 기억하고, 텍스트 검색 중 사용자가 지도를 옮겼으면 자동 재검색 */
  /**
   * 핀을 꽂을 때 비워 둘 여백(지도 기준 px). 매장 목록이 펼쳐져 있는지에 따라 달라진다.
   * - 위: 검색창·필터 줄 아래 + 핀 높이 (모바일에서 목록을 펼쳤으면 목록 아래)
   * - 왼쪽(데스크톱): 목록을 펼쳤으면 목록 오른쪽 끝 + 여유, 접었으면 기본 여유만
   * - 오른쪽·아래: 지도 컨트롤 버튼 자리
   */
  const getMapPinFitPadding = (container: {
    height: number;
    width: number;
  }) => {
    const rootRect = panelRootRef.current?.getBoundingClientRect();
    const topBarRect = mapTopBarRef.current?.getBoundingClientRect();

    if (!rootRect || !topBarRect) {
      return null;
    }

    const listRect = isStoreListCollapsed
      ? null
      : (storeListPanelRef.current?.getBoundingClientRect() ?? null);
    const isDesktop = container.width >= 768;
    // 핀은 좌표 지점에서 위로 46px 솟으므로 그만큼 + 여유를 더 비운다.
    const pinTopSpace = 56;
    const edgeGap = 24;
    const topBarBottom = topBarRect.bottom - rootRect.top;
    const top =
      (!isDesktop && listRect
        ? Math.max(topBarBottom, listRect.bottom - rootRect.top)
        : topBarBottom) + pinTopSpace;
    const left =
      isDesktop && listRect ? listRect.right - rootRect.left + edgeGap : 32;

    return {
      bottom: 56,
      left,
      right: isDesktop ? 96 : 76,
      top,
    };
  };
  const handleViewportChange = (viewport: MapViewport) => {
    // 지도를 옮겨도 자동으로 다시 검색하지 않는다(화면만 둘러보려는 사용자를 헷갈리게 하지 않도록).
    // 다시 찾기는 "이 위치에서 검색" 버튼으로만 한다(searchInCurrentArea).
    // 단, 뱃지(필터) 검색 중에는 결과가 처음 찾은 지역에 묶여 옮긴 화면에 핀이 뜨지 않으므로,
    // 사용자가 직접 끌어 옮긴 경우에 한해 선택한 뱃지를 유지한 채 보이는 영역에서 다시 찾는다.
    setMapViewport(viewport);
    updateMapCenter(viewport.center);

    if (!shouldRefreshTagSearchOnIdleRef.current) {
      return;
    }

    shouldRefreshTagSearchOnIdleRef.current = false;

    if (
      !isTagSearchQuery ||
      !hasActiveServiceFilter ||
      routeDestinationStoreId
    ) {
      return;
    }

    setSearchPoint(null);
    setSoloStoreId("");
    void searchVisibleArea("tag", { viewport }).then((results) => {
      if (results && filterStoresByServices(results).length === 0) {
        showToast("이 지역에는 선택한 서비스를 제공하는 매장이 없어요.");
      }
    });
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

    areaSearchRequestIdRef.current += 1;
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
    setRouteMapReadyKey("");
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
    setRouteMapReadyKey("");
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
    setRouteMapReadyKey("");
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
        markerEnterKey={`${currentStorePage}:${mapStoresKey}`}
        getPinFitPadding={getMapPinFitPadding}
        // 새 핀 묶음이 꽂히거나 목록을 펼치고 접을 때 가장 바깥 핀이 가리지 않는지 확인한다.
        // (페이지 이동은 goToStorePage의 fitTarget이 같은 여백으로 맞춘다)
        pinAutoFitKey={`${mapStoresKey}|${isStoreListCollapsed ? "collapsed" : "expanded"}`}
        isPinAutoFitPaused={Boolean(
          routeDestinationStoreId || soloStore || hasSelectedStoreInfo,
        )}
        shouldSkipPinAutoFit={() => isPinAutoFitSkippedRef.current}
        isFullBleed
        isSearchFromMapPointLoading={isMapSearchLoading}
        routePreview={routePreview}
        onRouteMapReady={setRouteMapReadyKey}
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
        markerColorInfoById={markerColorInfoById}
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
          // 뱃지(필터) 검색 중이면 이동이 끝난 뒤 보이는 영역에서 자동으로 다시 찾는다.
          shouldRefreshTagSearchOnIdleRef.current =
            isTagSearchQuery && hasActiveServiceFilter;
          // 사용자가 지도를 직접 옮김: 이후 텍스트 검색 정렬 중심은 보이는 지도 중심
          setSearchAnchorSource("map");
        }}
        onViewportChange={handleViewportChange}
        onSelectedStoreCardClose={closeSelectedStoreInfo}
        onSearchFromMapPoint={() => {
          void searchInCurrentArea();
        }}
        onSelectStore={handleStoreSelect}
        otherStores={isOtherStoresVisible ? otherMapStores : []}
        otherStoreCount={otherMapStores.length}
        isOtherStoresVisible={isOtherStoresVisible}
        onToggleOtherStores={() =>
          setIsOtherStoresVisible((isVisible) => !isVisible)
        }
      />

      <div className="pointer-events-none absolute inset-0 z-10 pt-16 md:pt-0">
        <div
          ref={mapTopBarRef}
          className="pointer-events-auto absolute top-3 right-3 left-3 flex flex-col gap-3 md:top-5 md:right-5 md:left-5 md:flex-row md:flex-wrap md:items-start"
        >
          <div className="flex min-w-0 flex-col gap-3 md:flex-1 md:flex-row md:flex-nowrap md:items-start">
            <div
              ref={collapsedSearchRef}
              className="relative w-[min(420px,calc(100vw-48px))] max-w-full min-w-0 shrink-0 self-center sm:self-start md:w-[360px] lg:w-[420px]"
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

                      areaSearchRequestIdRef.current += 1;
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
                            key={`${currentStorePage}:${store.id}`}
                            type="button"
                            onClick={() =>
                              handleStoreSelect(store.id, {
                                focusMap: true,
                                showOnlySelected: true,
                              })
                            }
                            className={cn(
                              // 페이지가 바뀌면(key 변경으로 새로 그려짐) 서서히 나타난다.
                              "animate-store-page-in flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.04]",
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
                              onClick={() => goToStorePage(activeStorePage - 1)}
                              disabled={activeStorePage === 0}
                              className="text-text-secondary flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-white/10"
                              aria-label="이전 페이지"
                            >
                              <ChevronLeft size={15} />
                            </button>
                            {getPaginationItems(
                              activeStorePage,
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
                                    page === activeStorePage
                                      ? "bg-brand text-white"
                                      : "text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10",
                                  )}
                                  aria-current={
                                    page === activeStorePage
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
                              onClick={() => goToStorePage(activeStorePage + 1)}
                              disabled={activeStorePage === storePageCount - 1}
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
              경로 탐색 중입니다
            </p>
            <p className="text-text-secondary mt-2 text-xs leading-5 font-semibold">
              {isRouteLoading
                ? "현재 위치에서 선택한 매장까지의 경로와 예상 시간을 계산하고 있어요."
                : "출발지부터 도착지까지 한눈에 보이도록 지도를 맞추고 있어요."}
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
