import {
  Bike,
  Bus,
  CalendarCheck,
  Car,
  ChevronLeft,
  ChevronRight,
  CornerUpRight,
  MapPinned,
  SportShoe,
} from "lucide-react";
import type { StoreLocation, StoreRouteMode } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";

const serviceBadgeClassName =
  "bg-surface-muted text-text-secondary rounded-full px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300";
const bubblePanelClassName = cn(
  "border-border after:border-border relative w-full rounded-sm border bg-white/95 p-4 text-sm shadow-lg backdrop-blur",
  "after:absolute after:bottom-[-7px] after:left-1/2 after:h-3.5 after:w-3.5 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:bg-white/95",
  "dark:border-white/10 dark:bg-zinc-950/92 dark:after:border-white/10 dark:after:bg-zinc-950/92",
);
const compactActionButtonClassName =
  "rounded-sm shadow-sm transition-shadow hover:shadow-md";
const routeModeButtonClassName =
  "group relative flex h-8 w-8 items-center justify-center rounded-sm transition duration-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none";
const routeModeTooltipClassName =
  "pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-50 flex -translate-x-1/2 -translate-y-1 items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-white opacity-0 shadow-xl transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100";

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

export type RouteSummary = {
  isLoading?: boolean;
  /** 가까운 매장인데 차량·자전거 경로가 크게 돌아가 도보를 추천하는지 */
  isWalkRecommended?: boolean;
  remainingDistanceText: string;
  travelTimeText: string;
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

export const StorePanelInfoBubble = ({
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
              routeModeButtonClassName,
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
            <span className={routeModeTooltipClassName}>{option.label}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  if (isLoading) {
    return (
      <div className={bubblePanelClassName}>
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
      <div className={bubblePanelClassName}>
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
    <div className={cn(bubblePanelClassName, "text-left")}>
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
              <div className="text-text-secondary mt-2 flex flex-col items-stretch gap-2 rounded-sm bg-gray-100 px-3 py-2 text-[11px] leading-4 font-bold break-keep sm:flex-row sm:items-center sm:justify-between sm:pr-1.5 dark:bg-white/10 dark:text-gray-300">
                <span className="min-w-0">
                  가까운 거리라 도보 이동을 추천해요
                </span>
                <button
                  type="button"
                  onClick={() => onRouteModeChange("walk")}
                  className="text-brand-hover dark:text-brand flex h-7 shrink-0 items-center justify-center gap-1 rounded-sm bg-white px-2 font-extrabold whitespace-nowrap shadow-sm transition hover:shadow-md dark:bg-zinc-950"
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
                compactActionButtonClassName,
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
                compactActionButtonClassName,
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
              compactActionButtonClassName,
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
