import { formatDistance } from "@/features/store/lib/geo";
import type { UserLocation } from "@/features/store/lib/geo";
import type {
  StoreLocation,
  StoreRoute,
  StoreRouteSegment,
  StoreRouteSegmentKind,
  StoreRouteMode,
} from "@/features/store/types";
import { requestJson } from "@/shared/api/http";

type StoreNearbyItemResponse = {
  storeId: number;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  consultServices?: string[];
  providedServices?: string[];
};

type NearbyStoresResponse = {
  stores: StoreNearbyItemResponse[];
};

type StoreDetailResponse = {
  storeId: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  businessHours?: string;
  phone?: string;
  consultServices?: string[];
  providedServices?: string[];
};

type RouteResponse = {
  distanceMeters: number;
  durationSeconds: number;
  mode: StoreRouteMode;
  path?: RoutePointResponse[] | RouteSegmentResponse[];
  paths?: RoutePointResponse[] | RouteSegmentResponse[];
  routePath?: RoutePointResponse[] | RouteSegmentResponse[];
  legs?: RouteSegmentResponse[];
  sections?: RouteSegmentResponse[];
  segments?: RouteSegmentResponse[];
};

const isApiStoreId = (storeId: string) => /^\d+$/.test(storeId);

type RoutePointResponse = {
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  y?: number | string;
  x?: number | string;
};

type RouteSegmentResponse = {
  bus?: RouteTransitInfoResponse;
  mode?: string;
  type?: string;
  kind?: string;
  transportType?: string;
  transitType?: string;
  trafficType?: string;
  vehicleType?: string;
  line?: string;
  lineName?: string;
  name?: string;
  routeName?: string;
  subwayLine?: string;
  subwayLineName?: string;
  subway?: RouteTransitInfoResponse;
  transport?: RouteTransitInfoResponse;
  transit?: RouteTransitInfoResponse;
  color?: string;
  routeColor?: string;
  lineColor?: string;
  route?: RouteTransitInfoResponse;
  path?: RoutePointResponse[];
  points?: RoutePointResponse[];
  coordinates?: RoutePointResponse[];
  steps?: RouteSegmentResponse[];
  subPath?: RouteSegmentResponse[];
  subPaths?: RouteSegmentResponse[];
};

type RouteTransitInfoResponse = {
  color?: string;
  line?: string;
  lineColor?: string;
  lineName?: string;
  name?: string;
  routeColor?: string;
  routeName?: string;
  type?: string;
};

const subwayLineColors: Record<string, string> = {
  "1": "#0052a4",
  "1호선": "#0052a4",
  "2": "#00a84d",
  "2호선": "#00a84d",
  "3": "#ef7c1c",
  "3호선": "#ef7c1c",
  "4": "#00a5de",
  "4호선": "#00a5de",
  "5": "#996cac",
  "5호선": "#996cac",
  "6": "#cd7c2f",
  "6호선": "#cd7c2f",
  "7": "#747f00",
  "7호선": "#747f00",
  "8": "#e6186c",
  "8호선": "#e6186c",
  "9": "#bdb092",
  "9호선": "#bdb092",
  경의중앙: "#77c4a3",
  경의중앙선: "#77c4a3",
  경춘: "#0c8e72",
  경춘선: "#0c8e72",
  공항: "#0090d2",
  공항철도: "#0090d2",
  분당: "#f5a200",
  수인분당: "#f5a200",
  신분당: "#d4003b",
  신분당선: "#d4003b",
  우이신설: "#b0ce18",
  우이신설선: "#b0ce18",
  서해: "#8fc31f",
  서해선: "#8fc31f",
  김포골드: "#a17800",
  김포골드라인: "#a17800",
};

const getRoutePoint = (
  point: RoutePointResponse | undefined,
): StoreRoute["path"][number] | null => {
  const lat = Number(point?.lat ?? point?.latitude ?? point?.y);
  const lng = Number(point?.lng ?? point?.longitude ?? point?.x);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

const getRouteSegmentPath = (
  segment: RoutePointResponse | RouteSegmentResponse,
) => {
  if ("lat" in segment || "latitude" in segment || "y" in segment) {
    const point = getRoutePoint(segment);

    return point ? [point] : [];
  }

  const routeSegment = segment as RouteSegmentResponse;

  return (
    routeSegment.path ??
    routeSegment.points ??
    routeSegment.coordinates ??
    []
  )
    .map(getRoutePoint)
    .filter((point): point is StoreRoute["path"][number] => Boolean(point));
};

const isRoutePointLike = (
  segment: RoutePointResponse | RouteSegmentResponse,
): segment is RoutePointResponse =>
  "lat" in segment ||
  "latitude" in segment ||
  "lng" in segment ||
  "longitude" in segment ||
  "x" in segment ||
  "y" in segment;

const isSegmentArray = (
  source: RoutePointResponse[] | RouteSegmentResponse[] | undefined,
): source is RouteSegmentResponse[] =>
  Boolean(source?.some((item) => !isRoutePointLike(item)));

const getRoutePath = (response: RouteResponse) => {
  const routeSource =
    response.path ??
    response.paths ??
    response.routePath ??
    response.legs ??
    response.sections ??
    [];

  return routeSource.flatMap(getRouteSegmentPath);
};

const getRouteSegmentSources = (response: RouteResponse) => {
  const pathSegments = isSegmentArray(response.path) ? response.path : [];
  const pathsSegments = isSegmentArray(response.paths) ? response.paths : [];
  const routePathSegments = isSegmentArray(response.routePath)
    ? response.routePath
    : [];

  return [
    ...(response.legs ?? []),
    ...(response.sections ?? []),
    ...(response.segments ?? []),
    ...pathSegments,
    ...pathsSegments,
    ...routePathSegments,
  ];
};

const normalizeSegmentKind = (
  segment: RouteSegmentResponse,
): StoreRouteSegmentKind => {
  const rawKind = (
    segment.kind ??
    segment.mode ??
    segment.type ??
    segment.transportType ??
    segment.transitType ??
    segment.trafficType ??
    segment.vehicleType ??
    segment.transport?.type ??
    segment.transit?.type ??
    segment.subway?.type ??
    segment.bus?.type ??
    ""
  )
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (
    rawKind.includes("walk") ||
    rawKind.includes("pedestrian") ||
    rawKind.includes("도보")
  ) {
    return "walk";
  }

  if (
    rawKind.includes("subway") ||
    rawKind.includes("metro") ||
    rawKind.includes("지하철")
  ) {
    return "subway";
  }

  if (rawKind.includes("bus") || rawKind.includes("버스")) {
    return "bus";
  }

  if (rawKind.includes("car")) {
    return "car";
  }

  if (rawKind.includes("bike") || rawKind.includes("bicycle")) {
    return "bicycle";
  }

  return "transit";
};

const normalizeColor = (color?: string) => {
  if (!color) {
    return undefined;
  }

  return color.startsWith("#") ? color : `#${color}`;
};

const getSegmentLineName = (segment: RouteSegmentResponse) =>
  segment.lineName ??
  segment.subwayLineName ??
  segment.subwayLine ??
  segment.routeName ??
  segment.line ??
  segment.name ??
  segment.transport?.lineName ??
  segment.transport?.routeName ??
  segment.transport?.line ??
  segment.transport?.name ??
  segment.transit?.lineName ??
  segment.transit?.routeName ??
  segment.transit?.line ??
  segment.transit?.name ??
  segment.subway?.lineName ??
  segment.subway?.routeName ??
  segment.subway?.line ??
  segment.subway?.name ??
  segment.bus?.lineName ??
  segment.bus?.routeName ??
  segment.bus?.line ??
  segment.bus?.name ??
  segment.route?.lineName ??
  segment.route?.routeName ??
  segment.route?.line ??
  segment.route?.name;

const getSegmentColor = (segment: RouteSegmentResponse) => {
  const responseColor = normalizeColor(
    segment.color ??
      segment.routeColor ??
      segment.lineColor ??
      segment.transport?.color ??
      segment.transport?.routeColor ??
      segment.transport?.lineColor ??
      segment.transit?.color ??
      segment.transit?.routeColor ??
      segment.transit?.lineColor ??
      segment.subway?.color ??
      segment.subway?.routeColor ??
      segment.subway?.lineColor ??
      segment.bus?.color ??
      segment.bus?.routeColor ??
      segment.bus?.lineColor ??
      segment.route?.color ??
      segment.route?.routeColor ??
      segment.route?.lineColor,
  );

  if (responseColor) {
    return responseColor;
  }

  const lineName = getSegmentLineName(segment);

  if (!lineName) {
    return undefined;
  }

  const normalizedLineName = lineName.replace(/\s/g, "");
  const matchedLineKey = Object.keys(subwayLineColors).find((lineKey) =>
    normalizedLineName.includes(lineKey),
  );

  return matchedLineKey ? subwayLineColors[matchedLineKey] : undefined;
};

const getRouteSegments = (response: RouteResponse): StoreRouteSegment[] => {
  const routeSource = getRouteSegmentSources(response).flatMap((segment) => {
    return segment.steps ?? segment.subPath ?? segment.subPaths ?? [segment];
  });

  if (routeSource.length === 0) {
    return [];
  }

  return routeSource
    .map((segment) => ({
      kind: normalizeSegmentKind(segment),
      lineName: getSegmentLineName(segment),
      color: getSegmentColor(segment),
      path: getRouteSegmentPath(segment),
    }))
    .filter((segment) => segment.path.length > 0);
};

const toNearbyStoreLocation = (
  store: StoreNearbyItemResponse,
): StoreLocation => ({
  id: String(store.storeId),
  name: store.name,
  address: "상세 주소 확인 중",
  consultServices: store.consultServices,
  phone: "",
  providedServices: store.providedServices,
  lat: Number(store.lat),
  lng: Number(store.lng),
  distanceText: formatDistance(store.distanceKm * 1000),
});

const toStoreLocation = (
  store: StoreDetailResponse,
  fallback?: StoreLocation,
): StoreLocation => ({
  id: String(store.storeId),
  name: store.name,
  address: store.address,
  businessHours: store.businessHours,
  consultServices: store.consultServices ?? fallback?.consultServices,
  phone: store.phone ?? "",
  providedServices: store.providedServices ?? fallback?.providedServices,
  lat: Number(store.lat),
  lng: Number(store.lng),
  distanceText: fallback?.distanceText,
});

export const storeService = {
  fetchNearbyStores: async (location?: UserLocation) => {
    if (!location) {
      return [];
    }

    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radius: "5",
    });

    const response = await requestJson<NearbyStoresResponse>(
      `/stores/nearby?${params.toString()}`,
      {
        timeoutMs: 12000,
      },
    );

    const stores = response.stores.slice(0, 20).map(toNearbyStoreLocation);

    return stores;
  },
  fetchStoreDetail: async (storeId: string, fallback?: StoreLocation) => {
    if (!isApiStoreId(storeId)) {
      return fallback ?? null;
    }

    const response = await requestJson<StoreDetailResponse>(
      `/stores/${storeId}`,
      {
        timeoutMs: 7000,
      },
    );

    return toStoreLocation(response, fallback);
  },
  fetchRoute: async (
    storeId: string,
    location: UserLocation,
    mode: StoreRouteMode,
  ): Promise<StoreRoute> => {
    if (!isApiStoreId(storeId)) {
      throw new Error("NON_API_STORE_ID");
    }

    const params = new URLSearchParams({
      fromLat: String(location.lat),
      fromLng: String(location.lng),
      mode,
    });

    const response = await requestJson<RouteResponse>(
      `/stores/${storeId}/directions?${params.toString()}`,
      {
        timeoutMs: 7000,
      },
    );

    return {
      distanceMeters: response.distanceMeters,
      durationSeconds: response.durationSeconds,
      mode: response.mode,
      path: getRoutePath(response),
      segments: getRouteSegments(response),
    };
  },
};
