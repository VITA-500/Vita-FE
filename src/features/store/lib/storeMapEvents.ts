import type {
  KakaoMapEventApi,
  KakaoMapWithCenter,
} from "@/features/store/lib/kakaoMapTypes";
import type { KakaoMapWithProjection } from "@/features/store/lib/mapFit";
import type { createSelectedStoreCardController } from "@/features/store/lib/storeMapCardController";
import type {
  StoreMapEffectContext,
  StoreMapInstance,
} from "@/features/store/lib/storeMapPreviewTypes";

type SelectedStoreCardController = ReturnType<
  typeof createSelectedStoreCardController
>;

/**
 * 지도 이벤트를 연결한다: 드래그 끝(지점 선택·카드 닫기), 빈 곳 클릭(카드 닫기), 확대/축소·이동(카드 위치 갱신),
 * 멈춤(idle: 중심·영역 알림, 보류한 카드 보이기, 경로 그리기 시작, 확대 후 카드 자리 확보, 길찾기 가림 확인).
 * 연결을 끊는 함수를 돌려준다.
 */
export const bindStoreMapEvents = ({
  autoFitCardAfterZoomRef,
  getRouteObstacleRect,
  getSelectedStoreCardLayout,
  isRouteCardDocked,
  isSelectedCardInView,
  kakaoMaps,
  lastMarkerClickAtRef,
  map,
  mapContainerRef,
  markRouteFitReadyRef,
  onCenterChange,
  onMapPointSelect,
  onRouteObstructed,
  onSelectedStoreCardClose,
  onViewportChange,
  panToFitSelectedCard,
  pendingRouteFitKeyRef,
  revealedCardStoreId,
  revealPendingCard,
  routePreview,
  selectedStore,
  selectedStoreCardRef,
  updateSelectedStoreCardPosition,
}: StoreMapEffectContext & StoreMapInstance & SelectedStoreCardController) => {
  const mapEventApi = kakaoMaps.event as unknown as KakaoMapEventApi;
  const handleMapDragEnd = () => {
    const movedCenter = (map as KakaoMapWithCenter).getCenter();

    onMapPointSelect?.({
      lat: movedCenter.getLat(),
      lng: movedCenter.getLng(),
    });
    // 길찾기 중(데스크톱)에는 지도를 끌어 경로를 살펴봐도 카드를 닫지 않는다.
    const isDesktop =
      (mapContainerRef.current?.getBoundingClientRect().width ?? 0) >= 768;

    if (!(isRouteCardDocked && isDesktop)) {
      onSelectedStoreCardClose?.();
    }
    updateSelectedStoreCardPosition();
  };
  const handleMapZoomChanged = () => {
    updateSelectedStoreCardPosition();
  };

  if (onMapPointSelect) {
    mapEventApi.addListener(map, "dragend", handleMapDragEnd);
  }

  // 지도 빈 곳을 클릭하면 정보 카드를 닫는다(드래그는 click이 아님).
  // 길찾기 중 데스크톱에서는 경로를 살펴보며 클릭해도 카드를 유지한다.
  const handleMapClick = () => {
    // 핀 클릭 직후 지도 click이 이어서 들어오는 경우는 무시(방금 연 카드가 바로 닫히지 않도록)
    if (Date.now() - lastMarkerClickAtRef.current < 300) {
      return;
    }

    const isDesktop =
      (mapContainerRef.current?.getBoundingClientRect().width ?? 0) >= 768;

    if (selectedStore && !(isRouteCardDocked && isDesktop)) {
      onSelectedStoreCardClose?.();
    }
  };

  mapEventApi.addListener(map, "click", handleMapClick);
  mapEventApi.addListener(map, "zoom_changed", handleMapZoomChanged);
  // 확대/축소 후 초점 이동(panTo)·드래그 중에도 정보 카드가 핀을 따라 움직이도록 매 이동마다 위치를 갱신한다.
  mapEventApi.addListener(map, "center_changed", handleMapZoomChanged);

  /** 길찾기 중 지도 이동·확대가 끝났을 때 경로/출발·도착/카드가 패널에 가려졌는지 확인한다. */
  const checkRouteObstruction = () => {
    const obstacleRect = getRouteObstacleRect?.();
    const containerRect = mapContainerRef.current?.getBoundingClientRect();
    const projection = (map as KakaoMapWithProjection).getProjection?.();

    if (
      !routePreview ||
      !obstacleRect ||
      !containerRect ||
      !projection?.containerPointFromCoords ||
      !onRouteObstructed
    ) {
      return;
    }

    const isInsideObstacle = (clientX: number, clientY: number) =>
      clientX >= obstacleRect.left &&
      clientX <= obstacleRect.right &&
      clientY >= obstacleRect.top &&
      clientY <= obstacleRect.bottom;
    const routePoints = [
      routePreview.origin,
      routePreview.destination,
      ...routePreview.path,
    ];
    const isRouteCovered = routePoints.some((point) => {
      const containerPoint = projection.containerPointFromCoords?.(
        new kakaoMaps.LatLng(point.lat, point.lng),
      );

      return (
        containerPoint &&
        isInsideObstacle(
          containerRect.left + containerPoint.x,
          containerRect.top + containerPoint.y,
        )
      );
    });
    const cardRect = selectedStoreCardRef.current?.getBoundingClientRect();
    const isCardCovered = Boolean(
      cardRect &&
      cardRect.width > 0 &&
      cardRect.left < obstacleRect.right &&
      cardRect.right > obstacleRect.left &&
      cardRect.top < obstacleRect.bottom &&
      cardRect.bottom > obstacleRect.top,
    );

    if (isRouteCovered || isCardCovered) {
      onRouteObstructed();
    }
  };
  const handleMapIdle = () => {
    const center = (map as KakaoMapWithCenter).getCenter();

    onCenterChange?.({ lat: center.getLat(), lng: center.getLng() });

    const bounds = map.getBounds?.();
    const southWest = bounds?.getSouthWest?.();
    const northEast = bounds?.getNorthEast?.();

    if (southWest && northEast) {
      onViewportChange?.({
        center: { lat: center.getLat(), lng: center.getLng() },
        northEast: { lat: northEast.getLat(), lng: northEast.getLng() },
        southWest: { lat: southWest.getLat(), lng: southWest.getLng() },
      });
    }
    revealPendingCard();

    // 길찾기 범위 맞춤 이동이 끝났으면 경로 그리기를 시작한다.
    if (pendingRouteFitKeyRef.current) {
      markRouteFitReadyRef.current(pendingRouteFitKeyRef.current);
    }

    // 확대/축소 버튼으로 카드가 화면 위쪽·가장자리 밖으로 나가게 되면, 지도를 살짝 밀어 카드를 핀 위에 온전히 띄운다.
    // 사용자가 직접 끌거나 휠로 움직인 경우에는 밀지 않는다(길찾기 중 지도를 자유롭게 옮겨 볼 수 있어야 하므로).
    // (핀 자체가 화면 밖으로 나간 경우도 밀지 않는다)
    const shouldAutoFit = autoFitCardAfterZoomRef.current;

    autoFitCardAfterZoomRef.current = false;

    const layout =
      shouldAutoFit &&
      revealedCardStoreId &&
      revealedCardStoreId === selectedStore?.id
        ? getSelectedStoreCardLayout()
        : null;

    if (
      layout &&
      layout.point.x >= 0 &&
      layout.point.x <= layout.containerRect.width &&
      layout.point.y >= 0 &&
      layout.point.y <= layout.containerRect.height &&
      !isSelectedCardInView(layout)
    ) {
      panToFitSelectedCard(layout);
    }

    checkRouteObstruction();
  };

  // idle 이벤트에서만 알린다. (effect 안에서 바로 호출하면 부모 setState → 재렌더 → effect 재실행 무한 루프)
  mapEventApi.addListener(map, "idle", handleMapIdle);

  return () => {
    if (onMapPointSelect) {
      mapEventApi.removeListener(map, "dragend", handleMapDragEnd);
    }
    mapEventApi.removeListener(map, "click", handleMapClick);
    mapEventApi.removeListener(map, "zoom_changed", handleMapZoomChanged);
    mapEventApi.removeListener(map, "center_changed", handleMapZoomChanged);
    mapEventApi.removeListener(map, "idle", handleMapIdle);
  };
};
