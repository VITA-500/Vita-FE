import {
  SameLocationStorePager,
  StoreInfoActions,
  StoreInfoDetails,
  StoreInfoTitle,
  StoreRouteSummarySection,
  type RouteSummary,
} from "@/features/store/detail/components/StorePanelInfoSections";
import { StoreRouteModeControl } from "@/features/store/route/components/StoreRouteModeControl";
import type { StoreMapPanelModel } from "@/features/store/panel/hooks/useStoreMapPanel";
import {
  STORE_CARD_SCROLL_AREA_ATTRIBUTE,
  STORE_CARD_SCROLL_MAX_HEIGHT_VAR,
} from "@/features/store/map/lib/storeCardScrollArea";
import type { StoreLocation } from "@/entities/store";
import type { StoreRouteMode } from "@/entities/route";
import type { Dispatch, SetStateAction } from "react";
import { cn } from "@/shared/lib/cn";

const bubblePanelClassName = cn(
  "border-border after:border-border relative w-full rounded-sm border bg-white/95 p-4 text-sm shadow-lg",
  "after:absolute after:bottom-[-7px] after:left-1/2 after:h-3.5 after:w-3.5 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:bg-white/95",
  "dark:border-white/10 dark:bg-zinc-950/92 dark:after:border-white/10 dark:after:bg-zinc-950/92",
);
/** 사이드바·바텀 시트 안에 넣을 때: 말풍선 테두리·꼬리 없이 패널 배경 그대로 쓴다. */
const panelContentClassName = "relative w-full text-sm";
/** 길찾기 카드 스크롤 영역 최대 높이(변수가 아직 없으면 화면 높이 기준으로 제한) */
const routeScrollAreaStyle = {
  maxHeight: `min(480px, var(${STORE_CARD_SCROLL_MAX_HEIGHT_VAR}, calc(100vh - 256px)))`,
};
export type { RouteSummary } from "@/features/store/detail/components/StorePanelInfoSections";

type RouteFocusTarget = {
  key: number;
  points: { lat: number; lng: number }[];
} | null;

type StoreMapPanelInfoContentProps = Pick<
  StoreMapPanelModel,
  | "changeRouteMode"
  | "handleReserve"
  | "handleRouteStart"
  | "handleStoreSelect"
  | "isMapSearchLoading"
  | "isWaitingForPinSelection"
  | "mapSelectedStore"
  | "routeMode"
  | "routeResultMessage"
  | "routeSummary"
  | "selectTransitRoute"
  | "sameLocationStores"
  | "showNearbyStoresAfterRoute"
  | "soloStoreId"
> & {
  isBenefitCategory: boolean;
  isDesktop: boolean;
  isSelectedStoreRouteTarget: boolean;
  onRouteFocusTargetChange: Dispatch<SetStateAction<RouteFocusTarget>>;
  onSheetExpandedChange: (isExpanded: boolean) => void;
};

export const StoreMapPanelInfoContent = ({
  changeRouteMode,
  handleReserve,
  handleRouteStart,
  handleStoreSelect,
  isBenefitCategory,
  isDesktop,
  isMapSearchLoading,
  isSelectedStoreRouteTarget,
  isWaitingForPinSelection,
  mapSelectedStore,
  onRouteFocusTargetChange,
  onSheetExpandedChange,
  routeMode,
  routeResultMessage,
  routeSummary,
  selectTransitRoute,
  sameLocationStores,
  showNearbyStoresAfterRoute,
  soloStoreId,
}: StoreMapPanelInfoContentProps) => (
  <StorePanelInfoBubble
    variant="panel"
    canReserve={!isBenefitCategory}
    isLoading={isMapSearchLoading}
    isWaitingForPinSelection={isWaitingForPinSelection}
    isRouteDestination={isSelectedStoreRouteTarget}
    routeSummary={isSelectedStoreRouteTarget ? routeSummary : null}
    routeResultMessage={isSelectedStoreRouteTarget ? routeResultMessage : null}
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
    onFocusRoutePoints={(points) =>
      onRouteFocusTargetChange((target) => ({
        key: (target?.key ?? 0) + 1,
        points,
      }))
    }
    onTransitRouteSelect={selectTransitRoute}
    onRouteModeChange={(mode: StoreRouteMode) => {
      changeRouteMode(mode);
      if (!isDesktop) onSheetExpandedChange(false);
    }}
    onReserve={handleReserve}
  />
);

export const StorePanelInfoBubble = ({
  variant = "bubble",
  canReserve = true,
  onFocusRoutePoints,
  onTransitRouteSelect,
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
  /**
   * bubble: 지도 핀 위에 뜨는 말풍선 카드(내용이 길면 카드 안에서 스크롤).
   * panel: 매장 정보 사이드바·바텀 시트 안 내용(스크롤은 감싸는 패널이 맡는다).
   */
  variant?: "bubble" | "panel";
  /** 예약하기 버튼을 보여줄지. 제휴 혜택/서비스 매장은 예약을 받지 않는다. */
  canReserve?: boolean;
  /** 대중교통 경로의 구간을 눌렀을 때 지도를 그 좌표에 맞춘다. */
  onFocusRoutePoints?: (points: { lat: number; lng: number }[]) => void;
  onTransitRouteSelect?: (index: number) => void;
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
  const isPanel = variant === "panel";
  const containerClassName = isPanel
    ? panelContentClassName
    : bubblePanelClassName;
  // 말풍선 카드일 때만 카드 안에서 스크롤한다(패널은 패널 전체가 스크롤된다).
  const hasCardScrollArea = isRouteMode && !isPanel;
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
        <SameLocationStorePager
          currentIndex={sameLocationIndex}
          onMove={moveSameLocationStore}
          totalCount={sameLocationStores.length}
        />
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
      <div className={containerClassName}>
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
      <div className={containerClassName}>
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
    <div className={cn(containerClassName, "text-left")}>
      {/* 이동수단 버튼의 툴팁이 스크롤 영역에 잘리지 않도록 헤더는 스크롤 밖에 둔다. */}
      <div className="flex items-start justify-between gap-2">
        {header}
        {routeModeControl}
      </div>
      <div
        {...(hasCardScrollArea
          ? { [STORE_CARD_SCROLL_AREA_ATTRIBUTE]: "" }
          : {})}
        className={cn(
          // 세로 스크롤만 허용한다(overflow-y만 auto로 두면 가로 스크롤도 함께 생길 수 있다).
          // 스크롤바 자리를 미리 잡아(scrollbar-gutter), 경로 상세를 펼치고 접을 때 스크롤바가 생겼다 사라지며 내용이 좌우로 밀리지 않게 한다.
          hasCardScrollArea &&
            "[scrollbar-gutter:stable] overflow-x-hidden overflow-y-auto transition-[max-height] duration-300 ease-out",
        )}
        // 최대 높이는 지도 크기에 맞춰 지도 쪽(useKeepSelectedCardInView)에서 CSS 변수로 넣어 준다.
        // 카드가 길어져도 위쪽이 화면 밖으로 나가지 않고 안에서 스크롤된다.
        // 지도를 아래로 미는 동안 최대 높이도 함께 부드럽게 늘어나도록 transition을 준다.
        style={hasCardScrollArea ? routeScrollAreaStyle : undefined}
      >
        <div className="mt-3">
          <StoreInfoTitle store={store} />
          <StoreInfoDetails
            isPanel={isPanel}
            isRouteMode={isRouteMode}
            store={store}
          />
          <StoreRouteSummarySection
            onFocusRoutePoints={onFocusRoutePoints}
            onRouteModeChange={onRouteModeChange}
            onTransitRouteSelect={onTransitRouteSelect}
            routeResultMessage={routeResultMessage}
            routeSummary={routeSummary}
            selectedRouteMode={selectedRouteMode}
            storeName={store.name}
          />
          <StoreInfoActions
            canReserve={canReserve}
            isPanel={isPanel}
            isRouteDestination={isRouteDestination}
            isRouteMode={isRouteMode}
            onReserve={onReserve}
            onShowNearbyStores={onShowNearbyStores}
            onStartRoute={onStartRoute}
            store={store}
          />
        </div>
      </div>
    </div>
  );
};
