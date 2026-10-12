import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CornerUpRight,
  MapPinned,
  SportShoe,
} from "lucide-react";
import { StoreOpenStatusBadge } from "@/features/store/components/StoreOpenStatusBadge";
import { StoreRouteModeControl } from "@/features/store/components/StoreRouteModeControl";
import { TransitRouteDetails } from "@/features/store/components/TransitRouteDetails";
import {
  STORE_CARD_SCROLL_AREA_ATTRIBUTE,
  STORE_CARD_SCROLL_MAX_HEIGHT_VAR,
} from "@/features/store/lib/storeCardScrollArea";
import type { TransitRouteStep } from "@/features/store/lib/storeRoutePreview";
import type { StoreLocation, StoreRouteMode } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";

const serviceBadgeClassName =
  "bg-surface-muted text-text-secondary rounded-full px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300";
const bubblePanelClassName = cn(
  "border-border after:border-border relative w-full rounded-sm border bg-white/95 p-4 text-sm shadow-lg",
  "after:absolute after:bottom-[-7px] after:left-1/2 after:h-3.5 after:w-3.5 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:bg-white/95",
  "dark:border-white/10 dark:bg-zinc-950/92 dark:after:border-white/10 dark:after:bg-zinc-950/92",
);
/** 길찾기 카드 스크롤 영역 최대 높이(변수가 아직 없으면 화면 높이 기준으로 제한) */
const routeScrollAreaStyle = {
  maxHeight: `min(480px, var(${STORE_CARD_SCROLL_MAX_HEIGHT_VAR}, calc(100vh - 256px)))`,
};
const compactActionButtonClassName =
  "rounded-sm shadow-sm transition-shadow hover:shadow-md";
export type RouteSummary = {
  isLoading?: boolean;
  /** 가까운 매장인데 차량·자전거 경로가 크게 돌아가 도보를 추천하는지 */
  isWalkRecommended?: boolean;
  remainingDistanceText: string;
  travelTimeText: string;
  transitWalkTimeText?: string;
  transitSteps?: TransitRouteStep[];
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
    <StoreRouteModeControl
      routeResultMessage={routeResultMessage}
      selectedRouteMode={selectedRouteMode}
      onRouteModeChange={onRouteModeChange}
    />
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
    // 말풍선 꼬리(::after)는 카드 바깥 틀에 붙이고, 스크롤은 안쪽 영역에서만 한다.
    // 바깥 틀이 스크롤되면 꼬리가 처음 위치에 남아 내용 중간에 ▼ 표시처럼 보인다.
    <div className={cn(bubblePanelClassName, "text-left")}>
      {/* 이동수단 버튼의 툴팁이 스크롤 영역에 잘리지 않도록 헤더는 스크롤 밖에 둔다. */}
      <div className="flex items-start justify-between gap-2">
        {header}
        {routeModeControl}
      </div>
      <div
        {...(isRouteMode ? { [STORE_CARD_SCROLL_AREA_ATTRIBUTE]: "" } : {})}
        className={cn(
          // 세로 스크롤만 허용한다(overflow-y만 auto로 두면 가로 스크롤도 함께 생길 수 있다).
          // 스크롤바 자리를 미리 잡아(scrollbar-gutter), 경로 상세를 펼치고 접을 때 스크롤바가 생겼다 사라지며 내용이 좌우로 밀리지 않게 한다.
          isRouteMode &&
            "[scrollbar-gutter:stable] overflow-x-hidden overflow-y-auto transition-[max-height] duration-300 ease-out",
        )}
        // 최대 높이는 지도 크기에 맞춰 지도 쪽(useKeepSelectedCardInView)에서 CSS 변수로 넣어 준다.
        // 카드가 길어져도 위쪽이 화면 밖으로 나가지 않고 안에서 스크롤된다.
        // 지도를 아래로 미는 동안 최대 높이도 함께 부드럽게 늘어나도록 transition을 준다.
        style={isRouteMode ? routeScrollAreaStyle : undefined}
      >
        <div className="mt-3">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-base font-extrabold text-gray-950 dark:text-white">
              {store.name}
            </p>
            <StoreOpenStatusBadge
              businessHours={store.businessHours}
              openNow={store.openNow}
            />
          </div>

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
          {!isRouteMode && store.benefitDescription && (
            <p className="text-text-secondary mt-2 text-xs leading-5 font-semibold">
              {store.benefitDescription}
            </p>
          )}
          {!isRouteMode && (
            <>
              <ServiceBadges
                title="상담 가능"
                services={store.consultServices}
              />
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
              <div className="bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand mt-3 rounded-sm px-3 py-2.5">
                <div className="flex min-w-0 flex-wrap items-end gap-x-2 gap-y-1">
                  <strong className="text-xl leading-none font-extrabold">
                    {routeSummary.isLoading
                      ? "계산 중"
                      : routeSummary.travelTimeText}
                  </strong>
                  {!routeSummary.isLoading && (
                    <span className="pb-0.5 text-[11px] leading-4 font-extrabold text-current/75">
                      {selectedRouteMode === "transit" &&
                      routeSummary.transitWalkTimeText
                        ? `도보 ${routeSummary.transitWalkTimeText} · 총 ${routeSummary.remainingDistanceText}`
                        : `총 ${routeSummary.remainingDistanceText}`}
                    </span>
                  )}
                </div>
              </div>
              {!routeSummary.isLoading && selectedRouteMode === "transit" && (
                <TransitRouteDetails
                  destinationName={store.name}
                  steps={routeSummary.transitSteps ?? []}
                />
              )}
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
    </div>
  );
};
