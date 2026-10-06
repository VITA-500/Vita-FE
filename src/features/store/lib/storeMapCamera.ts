import type { KakaoMapEventApi } from "@/features/store/lib/kakaoMapTypes";
import {
  getRouteFitPadding,
  getStoreCardHeight,
  getStoreCardTopInset,
  STORE_CARD_MARKER_GAP,
  type KakaoMapWithProjection,
} from "@/features/store/lib/mapFit";
import type {
  StoreMapEffectContext,
  StoreMapInstance,
} from "@/features/store/lib/storeMapPreviewTypes";

/** 지도 타일이 그려졌다는 이벤트(tilesloaded)가 오지 않아도 로딩 화면을 걷는 시간(ms) */
const MAP_FIRST_PAINT_FALLBACK_MS = 3000;
/** 길찾기: 지도 범위 맞춤 후 idle 신호가 오지 않을 때 경로 그리기를 시작하기까지 기다리는 최대 시간(ms) */
const ROUTE_FIT_READY_FALLBACK_MS = 800;

/**
 * 지도를 만들거나(처음 한 번) 이미 만든 지도를 가져와 초점을 맞춘다.
 * - 처음 만들 때: 첫 타일이 그려지면 로딩 화면을 걷는다.
 * - 길찾기 경로가 새로 오면: 출발-경로-도착이 보이도록 범위를 맞추고, 맞춤이 끝나면 경로 그리기를 시작하게 한다.
 * - 초점 지점이 바뀌면: 그 지점으로 옮긴다(선택 매장이면 카드까지 함께 보이도록 중심 보정).
 * 지도를 만들 수 없거나 아직 기준 지점이 없으면 null.
 */
export const setupStoreMap = ({
  fittedRouteKeyRef,
  focusPoint,
  focusPointRef,
  isKakaoMapReady,
  mapContainerRef,
  mapRef,
  markRouteFitReadyRef,
  pendingRouteFitKeyRef,
  routeFitFallbackTimeoutRef,
  routeLeftInset,
  routePreview,
  routePreviewRef,
  searchPoint,
  searchPointRef,
  selectedStore,
  selectedStoreCard,
  selectedStoreCardLeftInset,
  selectedStoreCardRef,
  setIsMapFirstPainted,
  stores,
}: StoreMapEffectContext): StoreMapInstance | null => {
  if (!isKakaoMapReady || !mapContainerRef.current || !window.kakao?.maps) {
    return null;
  }

  const kakaoMaps = window.kakao.maps;
  const centerStore = selectedStore ?? stores[0];

  if (!focusPoint && !searchPoint && !centerStore) {
    return null;
  }

  const initialCenter = focusPoint
    ? new kakaoMaps.LatLng(focusPoint.lat, focusPoint.lng)
    : searchPoint
      ? new kakaoMaps.LatLng(searchPoint.lat, searchPoint.lng)
      : new kakaoMaps.LatLng(centerStore.lat, centerStore.lng);

  const isNewMap = mapRef.current === null;
  const map =
    mapRef.current ??
    new kakaoMaps.Map(mapContainerRef.current, {
      center: initialCenter,
      level: 4,
    });
  const shouldRecenterByFocusPoint =
    Boolean(focusPoint) && focusPointRef.current !== focusPoint;
  const shouldFitRoute =
    Boolean(routePreview) &&
    fittedRouteKeyRef.current !== routePreview?.routeKey;

  mapRef.current = map;
  focusPointRef.current = focusPoint;

  if (isNewMap) {
    // 첫 타일이 그려지면 로딩 화면을 걷는다. 이벤트가 오지 않아도 잠시 뒤에는 걷는다.
    const firstPaintEventApi = kakaoMaps.event as unknown as KakaoMapEventApi;
    const handleFirstTilesLoaded = () => {
      firstPaintEventApi.removeListener(
        map,
        "tilesloaded",
        handleFirstTilesLoaded,
      );
      setIsMapFirstPainted(true);
    };

    firstPaintEventApi.addListener(map, "tilesloaded", handleFirstTilesLoaded);
    window.setTimeout(handleFirstTilesLoaded, MAP_FIRST_PAINT_FALLBACK_MS);
  }
  searchPointRef.current = searchPoint;
  routePreviewRef.current = routePreview;

  if (routePreview && (isNewMap || shouldFitRoute)) {
    const bounds = new kakaoMaps.LatLngBounds();
    const padding = getRouteFitPadding({
      cardElement: selectedStoreCardRef.current,
      containerWidth:
        mapContainerRef.current?.getBoundingClientRect().width ?? 0,
      hasStoreCard: Boolean(selectedStoreCard),
      routeLeftInset,
      selectedStoreCardLeftInset,
    });

    routePreview.path.forEach((point) => {
      bounds.extend(new kakaoMaps.LatLng(point.lat, point.lng));
    });
    map.setBounds(
      bounds,
      padding.top,
      padding.right,
      padding.bottom,
      padding.left,
    );
    fittedRouteKeyRef.current = routePreview.routeKey;

    // 범위 맞춤이 끝나면(idle) 경로를 그리기 시작한다. idle이 오지 않으면 잠시 뒤 시작한다.
    const fittedRouteKey = routePreview.routeKey;

    pendingRouteFitKeyRef.current = fittedRouteKey;
    window.clearTimeout(routeFitFallbackTimeoutRef.current);
    routeFitFallbackTimeoutRef.current = window.setTimeout(() => {
      markRouteFitReadyRef.current(fittedRouteKey);
    }, ROUTE_FIT_READY_FALLBACK_MS);
  } else if (isNewMap || shouldRecenterByFocusPoint) {
    const recenterPoint =
      shouldRecenterByFocusPoint && focusPoint ? focusPoint : null;

    if (recenterPoint) {
      map.setCenter(new kakaoMaps.LatLng(recenterPoint.lat, recenterPoint.lng));
      map.setLevel(4);

      // 선택 매장으로 이동할 때는 핀과 정보 카드가 왼쪽 패널에 가리지 않는 영역
      // (패널 오른쪽)의 가운데에 함께 보이도록 지도 중심을 보정한다.
      const isRecenteringToSelectedStore =
        Boolean(selectedStore && selectedStoreCard) &&
        selectedStore?.lat === recenterPoint.lat &&
        selectedStore?.lng === recenterPoint.lng;
      const projection = (map as KakaoMapWithProjection).getProjection?.();
      const containerRect = mapContainerRef.current?.getBoundingClientRect();

      if (
        isRecenteringToSelectedStore &&
        projection?.containerPointFromCoords &&
        containerRect
      ) {
        const leftInset =
          containerRect.width >= 768 ? selectedStoreCardLeftInset : 0;
        const topInset = getStoreCardTopInset(containerRect.width);
        const cardHeight = getStoreCardHeight(selectedStoreCardRef.current);
        const targetX = leftInset + (containerRect.width - leftInset) / 2;
        const targetY =
          (topInset + containerRect.height) / 2 +
          (cardHeight + STORE_CARD_MARKER_GAP) / 2;
        const deltaDegree = 0.001;
        const basePoint = projection.containerPointFromCoords(
          new kakaoMaps.LatLng(recenterPoint.lat, recenterPoint.lng),
        );
        const offsetPoint = projection.containerPointFromCoords(
          new kakaoMaps.LatLng(
            recenterPoint.lat + deltaDegree,
            recenterPoint.lng + deltaDegree,
          ),
        );
        const pxPerLat = (basePoint.y - offsetPoint.y) / deltaDegree;
        const pxPerLng = (offsetPoint.x - basePoint.x) / deltaDegree;

        if (pxPerLat > 0 && pxPerLng > 0) {
          const dx = targetX - containerRect.width / 2;
          const dy = targetY - containerRect.height / 2;

          map.setCenter(
            new kakaoMaps.LatLng(
              recenterPoint.lat + dy / pxPerLat,
              recenterPoint.lng - dx / pxPerLng,
            ),
          );
        }
      }
    }
  }

  return { kakaoMaps, map };
};
