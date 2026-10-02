import {
  formatDurationSeconds,
  formatRemainingDistance,
  formatWalkingTime,
  getDistanceMeters,
  type UserLocation,
} from "@/features/store/lib/geo";
import type { RoutePreview } from "@/features/store/lib/mapRoute";
import type {
  StoreLocation,
  StoreRoute,
  StoreRouteMode,
} from "@/features/store/types";

/** 이 직선거리(m) 안의 매장은 차량·자전거 경로가 크게 돌아가면 도보를 추천한다. */
const WALK_RECOMMEND_MAX_STRAIGHT_METERS = 300;
/** 경로 거리가 직선거리의 이 배수 이상이면 "크게 돌아간다"고 본다(일방통행·유턴 등). */
const WALK_RECOMMEND_DETOUR_RATIO = 2;

type RouteSummaryParams = {
  isRouteLoading: boolean;
  routeDestinationStore?: StoreLocation;
  routeMode: StoreRouteMode;
  userLocation: UserLocation | null;
  walkingRoute: StoreRoute | null;
};

/** 매장 카드에 보여줄 길찾기 요약(남은 거리·예상 시간·도보 추천). 길찾기 중이 아니면 null */
export const buildRouteSummary = ({
  isRouteLoading,
  routeDestinationStore,
  routeMode,
  userLocation,
  walkingRoute,
}: RouteSummaryParams) => {
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
};

type RoutePreviewParams = RouteSummaryParams & {
  routeDestinationStoreId: string;
  routeResultMessage: string | null;
};

/** 지도에 그릴 길찾기 경로(출발지·API 경로·도착지). 그릴 경로가 없으면 null */
export const buildRoutePreview = ({
  isRouteLoading,
  routeDestinationStore,
  routeDestinationStoreId,
  routeMode,
  routeResultMessage,
  userLocation,
  walkingRoute,
}: RoutePreviewParams): RoutePreview | null => {
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
};
