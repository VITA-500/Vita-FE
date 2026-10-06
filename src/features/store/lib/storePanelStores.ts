import {
  formatDistance,
  getDistanceMeters,
  type UserLocation,
} from "@/features/store/lib/geo";
import { getStoreMarkerLabel } from "@/features/store/lib/storeMarkerOverlays";
import type { StoreLocation } from "@/features/store/types";

export type MapSearchPoint = {
  lat: number;
  lng: number;
};

/** 지금 보이는 지도 영역 (중심·북동·남서 모서리) */
export type MapViewport = {
  center: { lat: number; lng: number };
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
};

/** 내 위치를 모를 때 지도를 처음 보여주고 주변 매장을 조회하는 기본 위치 */
export const defaultMapLocation = {
  lat: 37.50312732327876,
  lng: 127.04987850743296,
};

/** 텍스트 검색 반경(km). 주변 매장 조회 반경(storeService)과 같다. */
export const SEARCH_RADIUS_KM = 1.5;
/** 화면 영역 검색 시 조회 반경 상한(km). 지도를 크게 축소해도 이 반경까지만 불러온다. */
const MAX_VIEWPORT_SEARCH_RADIUS_KM = 3;

/** 검색 풀 = 지역별로 조회해 둔 매장(allStores) + 현재 지도에 불러온 매장(stores). */
export const buildSearchableStores = (
  allStores: StoreLocation[],
  stores: StoreLocation[],
  userLocation: UserLocation | null,
) => {
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
          distanceText: formatDistance(getDistanceMeters(userLocation, store)),
        }
      : store,
  );
};

/** 매장이 지금 보이는 지도 영역 안에 있는지 (영역 정보가 아직 없으면 검색 중심에서 반경 기준) */
export const isStoreInVisibleArea = (
  store: Pick<StoreLocation, "lat" | "lng">,
  viewport: MapViewport | null,
  searchCenter: MapSearchPoint,
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

/** 지금 보이는 지도 영역을 덮는 조회 중심·반경(km). 반경은 화면 중심→모서리 거리, 최대 3km. */
export const getViewportAreaQuery = (
  viewport: MapViewport | null,
  searchCenter: MapSearchPoint,
) => {
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
 * 매장을 기준 지점에서 가까운 순으로 정렬하고, 같은 지점에서 잰 거리를 표시값으로 붙인다.
 * (순서와 거리 표시가 어긋나지 않도록 둘 다 같은 기준 지점을 쓴다)
 */
export const sortStoresByDistance = (
  stores: StoreLocation[],
  origin: MapSearchPoint,
) =>
  stores
    .map((store) => ({
      distanceMeters: getDistanceMeters(origin, store),
      store,
    }))
    .sort((first, second) => first.distanceMeters - second.distanceMeters)
    .map(({ distanceMeters, store }) => ({
      ...store,
      distanceText: formatDistance(distanceMeters),
    }));

/** 지금 페이지 핀의 글자(A, B, C…). 다른 페이지에서 골라 함께 보여주는 매장 핀은 "•" */
export const buildMarkerLabelById = (
  pagedMapStores: StoreLocation[],
  selectedStoreOutsidePage?: StoreLocation,
) => {
  const markerLabelById: Record<string, string> = Object.fromEntries(
    pagedMapStores.map((store, index) => [
      store.id,
      getStoreMarkerLabel(index),
    ]),
  );

  if (selectedStoreOutsidePage) {
    markerLabelById[selectedStoreOutsidePage.id] = "•";
  }

  return markerLabelById;
};

type MapStoreVisibilityParams = {
  mapStores: StoreLocation[];
  pagedMapStores: StoreLocation[];
  routeDestinationStore?: StoreLocation;
  routeDestinationStoreId: string;
  selectedStoreOutsidePage?: StoreLocation;
  soloStore?: StoreLocation;
};

/**
 * 지도에 핀으로 보여줄 매장과, 반투명 원으로만 보여줄 나머지 매장.
 * - 길찾기 중: 도착 매장 핀만 / 목록에서 고른 매장: 그 핀만
 * - 그 외: 현재 페이지 핀(+ 다른 페이지에서 골라 카드가 떠 있는 매장)
 */
export const getMapStoreVisibility = ({
  mapStores,
  pagedMapStores,
  routeDestinationStore,
  routeDestinationStoreId,
  selectedStoreOutsidePage,
  soloStore,
}: MapStoreVisibilityParams) => {
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

  return { otherMapStores, visibleMapStores };
};

// 선택 매장과 같은 좌표(소수 5자리, 지도 묶음 핀과 같은 기준)에 있는 매장들
const getCoordinateKey = (store: Pick<StoreLocation, "lat" | "lng">) =>
  `${store.lat.toFixed(5)}:${store.lng.toFixed(5)}`;

/** 선택 매장과 같은 좌표에 있는 매장들(선택 매장 포함). 2곳 이상이면 카드에서 넘겨 볼 수 있다. */
export const getSameLocationStores = (
  selectedStore: StoreLocation | undefined,
  mapStores: StoreLocation[],
  stores: StoreLocation[],
) =>
  selectedStore
    ? (mapStores.some((store) => store.id === selectedStore.id)
        ? mapStores
        : stores
      ).filter(
        (store) => getCoordinateKey(store) === getCoordinateKey(selectedStore),
      )
    : [];
