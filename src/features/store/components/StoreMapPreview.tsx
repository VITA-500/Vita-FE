"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MapPin, RotateCcw } from "lucide-react";
import { useKakaoMapReady } from "@/features/store/hooks/useKakaoMapReady";
import type { UserLocation } from "@/features/store/lib/geo";
import type { StoreLocation } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

const clampPercent = (value: number) => Math.min(88, Math.max(12, value));
const routeStrokeColor = "#fdb61d";

type MapPoint = {
  lat: number;
  lng: number;
};

const getPathDistance = (from: MapPoint, to: MapPoint) => {
  const latDistance = to.lat - from.lat;
  const lngDistance = to.lng - from.lng;

  return Math.sqrt(latDistance ** 2 + lngDistance ** 2);
};

const getPartialRoutePath = (path: MapPoint[], progress: number) => {
  if (path.length <= 1 || progress >= 1) {
    return path;
  }

  const segmentDistances = path.slice(0, -1).map((point, index) => {
    return getPathDistance(point, path[index + 1]);
  });
  const totalDistance = segmentDistances.reduce(
    (sum, distance) => sum + distance,
    0,
  );

  if (totalDistance === 0) {
    return [path[0]];
  }

  let remainingDistance = totalDistance * Math.max(0, progress);
  const partialPath = [path[0]];

  for (let index = 0; index < segmentDistances.length; index += 1) {
    const segmentDistance = segmentDistances[index];
    const from = path[index];
    const to = path[index + 1];

    if (remainingDistance >= segmentDistance) {
      partialPath.push(to);
      remainingDistance -= segmentDistance;
      continue;
    }

    const segmentProgress =
      segmentDistance === 0 ? 0 : remainingDistance / segmentDistance;

    partialPath.push({
      lat: from.lat + (to.lat - from.lat) * segmentProgress,
      lng: from.lng + (to.lng - from.lng) * segmentProgress,
    });
    break;
  }

  return partialPath;
};

const getFallbackMarkerStyle = (
  store: StoreLocation,
  stores: StoreLocation[],
  index: number,
): CSSProperties => {
  const lats = stores.map((item) => item.lat);
  const lngs = stores.map((item) => item.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;
  const duplicateOffset = (index % 5) * 1.8;

  return {
    left: `${clampPercent(
      lngRange === 0
        ? 50 + duplicateOffset
        : 12 + ((store.lng - minLng) / lngRange) * 76,
    )}%`,
    top: `${clampPercent(
      latRange === 0
        ? 50 + duplicateOffset
        : 88 - ((store.lat - minLat) / latRange) * 76,
    )}%`,
  };
};

type KakaoMapEventApi = {
  addListener: (
    target: KakaoMap,
    eventName: "dragend" | "zoom_changed",
    callback: () => void,
  ) => void;
  removeListener: (
    target: KakaoMap,
    eventName: "dragend" | "zoom_changed",
    callback: () => void,
  ) => void;
};

type KakaoMapWithCenter = KakaoMap & {
  getCenter: () => {
    getLat: () => number;
    getLng: () => number;
  };
};

type SearchPointRef = MapPoint | null | undefined;
type FocusPointRef = MapPoint | null | undefined;

type KakaoMapProjection = {
  containerPointFromCoords?: (latlng: KakaoLatLng) => {
    x: number;
    y: number;
  };
};

type KakaoMapWithProjection = KakaoMap & {
  getProjection?: () => KakaoMapProjection;
};

type MapOverlayHandle = {
  marker?: KakaoMarker;
  overlay: KakaoCustomOverlay;
  cleanup?: () => void;
};

type RoutePreview = {
  destination: MapPoint;
  origin: MapPoint;
  path: MapPoint[];
  routeKey: string;
};

type RoutePreviewRef = RoutePreview | null | undefined;

type StoreMapPreviewProps = {
  className?: string;
  isFullBleed?: boolean;
  isRouteCardDocked?: boolean;
  focusPoint?: MapPoint | null;
  isSearchFromMapPointLoading?: boolean;
  selectedStore?: StoreLocation;
  selectedStoreCard?: ReactNode;
  selectedStoreId: string;
  stores: StoreLocation[];
  searchPoint?: MapPoint | null;
  routePreview?: RoutePreview | null;
  userLocation?: UserLocation | null;
  onMapPointSelect?: (point: MapPoint) => void;
  onSelectedStoreCardClose?: () => void;
  onSearchFromMapPoint?: () => void;
  onSelectStore: (storeId: string) => void;
};

export const StoreMapPreview = ({
  className,
  focusPoint,
  isFullBleed = false,
  isRouteCardDocked = false,
  isSearchFromMapPointLoading = false,
  onSelectStore,
  selectedStore,
  selectedStoreCard,
  selectedStoreId,
  searchPoint,
  routePreview,
  stores,
  userLocation,
  onMapPointSelect,
  onSelectedStoreCardClose,
  onSearchFromMapPoint,
}: StoreMapPreviewProps) => {
  const isKakaoMapReady = useKakaoMapReady();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlayRefs = useRef<MapOverlayHandle[]>([]);
  const routeOverlayRefs = useRef<KakaoCustomOverlay[]>([]);
  const routeLineRef = useRef<KakaoPolyline | null>(null);
  const [routeDrawState, setRouteDrawState] = useState({
    progress: 1,
    routeKey: "",
  });
  const [selectedStoreCardPosition, setSelectedStoreCardPosition] =
    useState<CSSProperties | null>(null);
  const focusPointRef = useRef<FocusPointRef>(undefined);
  const searchPointRef = useRef<SearchPointRef>(undefined);
  const routePreviewRef = useRef<RoutePreviewRef>(undefined);

  const routeDrawProgress =
    routePreview && routeDrawState.routeKey === routePreview.routeKey
      ? routeDrawState.progress
      : 0;
  const routePreviewKey = routePreview?.routeKey ?? "";

  useEffect(() => {
    if (!routePreviewKey) {
      return;
    }

    const startedAt = window.performance.now();
    const durationMs = 1400;
    let frameId = 0;

    const drawFrame = (timestamp: number) => {
      const nextProgress = Math.min((timestamp - startedAt) / durationMs, 1);

      setRouteDrawState({
        progress: nextProgress,
        routeKey: routePreviewKey,
      });

      if (nextProgress < 1) {
        frameId = window.requestAnimationFrame(drawFrame);
      }
    };

    frameId = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [routePreviewKey]);

  useEffect(() => {
    if (!isKakaoMapReady || !mapContainerRef.current || !window.kakao?.maps) {
      return;
    }

    const kakaoMaps = window.kakao.maps;
    const centerStore = selectedStore ?? stores[0];

    if (!focusPoint && !searchPoint && !centerStore) {
      return;
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
    const shouldRecenterBySearchPoint =
      Boolean(searchPoint) && searchPointRef.current !== searchPoint;
    const shouldRecenterByFocusPoint =
      Boolean(focusPoint) && focusPointRef.current !== focusPoint;
    const shouldFitRoute =
      Boolean(routePreview) &&
      routePreviewRef.current?.routeKey !== routePreview?.routeKey;

    mapRef.current = map;
    focusPointRef.current = focusPoint;
    searchPointRef.current = searchPoint;
    routePreviewRef.current = routePreview;

    if (routePreview && (isNewMap || shouldFitRoute)) {
      const bounds = new kakaoMaps.LatLngBounds();

      routePreview.path.forEach((point) => {
        bounds.extend(new kakaoMaps.LatLng(point.lat, point.lng));
      });
      map.setBounds(bounds, 120, 48, selectedStoreCard ? 230 : 72, 48);
    } else if (
      isNewMap ||
      shouldRecenterByFocusPoint ||
      shouldRecenterBySearchPoint
    ) {
      const recenterPoint =
        shouldRecenterBySearchPoint && searchPoint
          ? searchPoint
          : shouldRecenterByFocusPoint && focusPoint
            ? focusPoint
            : null;

      if (recenterPoint) {
        map.setCenter(
          new kakaoMaps.LatLng(recenterPoint.lat, recenterPoint.lng),
        );
      }
      map.setLevel(4);
    }

    const mapEventApi = kakaoMaps.event as unknown as KakaoMapEventApi;
    const updateSelectedStoreCardPosition = () => {
      if (!selectedStore || !mapContainerRef.current) {
        setSelectedStoreCardPosition(null);
        return;
      }

      const projection = (map as KakaoMapWithProjection).getProjection?.();
      const selectedPosition = new kakaoMaps.LatLng(
        selectedStore.lat,
        selectedStore.lng,
      );
      const point = projection?.containerPointFromCoords?.(selectedPosition);

      if (!point) {
        setSelectedStoreCardPosition(null);
        return;
      }

      setSelectedStoreCardPosition({
        left: `${point.x}px`,
        top: `${point.y}px`,
      });
    };
    const handleMapDragEnd = () => {
      const movedCenter = (map as KakaoMapWithCenter).getCenter();

      onMapPointSelect?.({
        lat: movedCenter.getLat(),
        lng: movedCenter.getLng(),
      });
      onSelectedStoreCardClose?.();
      updateSelectedStoreCardPosition();
    };
    const handleMapZoomChanged = () => {
      updateSelectedStoreCardPosition();
    };

    if (onMapPointSelect) {
      mapEventApi.addListener(map, "dragend", handleMapDragEnd);
    }
    mapEventApi.addListener(map, "zoom_changed", handleMapZoomChanged);

    overlayRefs.current.forEach(({ cleanup, overlay }) => {
      cleanup?.();
      overlay.setMap(null);
    });
    overlayRefs.current = stores.map((store) => {
      const isSelected = selectedStoreId === store.id;
      const position = new kakaoMaps.LatLng(store.lat, store.lng);
      const nativeMarker = new kakaoMaps.Marker({
        map,
        position,
        title: store.name,
        zIndex: isSelected ? 20 : 10,
      });
      const marker = document.createElement("button");
      marker.type = "button";
      marker.textContent = store.name.replace("VITA ", "");
      marker.setAttribute("aria-label", `${store.name} 선택`);
      marker.className = [
        "vita-map-marker",
        isSelected ? "vita-map-marker-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const handleMarkerClick = () => {
        onSelectStore(store.id);
      };

      marker.addEventListener("click", handleMarkerClick);

      return {
        marker: nativeMarker,
        cleanup: () => {
          marker.removeEventListener("click", handleMarkerClick);
          nativeMarker.setMap(null);
        },
        overlay: new kakaoMaps.CustomOverlay({
          content: marker,
          map,
          position,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: isSelected ? 20 : 10,
        }),
      };
    });

    if (userLocation) {
      const currentLocationMarker = document.createElement("div");
      currentLocationMarker.className = "vita-current-location-marker";
      currentLocationMarker.setAttribute("aria-label", "내 위치");

      overlayRefs.current.push({
        overlay: new kakaoMaps.CustomOverlay({
          content: currentLocationMarker,
          map,
          position: new kakaoMaps.LatLng(userLocation.lat, userLocation.lng),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 30,
        }),
      });
    }

    window.setTimeout(updateSelectedStoreCardPosition);

    return () => {
      if (onMapPointSelect) {
        mapEventApi.removeListener(map, "dragend", handleMapDragEnd);
      }
      mapEventApi.removeListener(map, "zoom_changed", handleMapZoomChanged);

      overlayRefs.current.forEach(({ cleanup, overlay }) => {
        cleanup?.();
        overlay.setMap(null);
      });
      overlayRefs.current = [];
    };
  }, [
    focusPoint,
    isKakaoMapReady,
    onSelectStore,
    onMapPointSelect,
    onSelectedStoreCardClose,
    onSearchFromMapPoint,
    routePreview,
    selectedStore,
    selectedStoreCard,
    selectedStoreId,
    searchPoint,
    stores,
    userLocation,
  ]);

  useEffect(() => {
    if (!isKakaoMapReady || !window.kakao?.maps || !mapRef.current) {
      return;
    }

    const kakaoMaps = window.kakao.maps;
    const map = mapRef.current;

    routeLineRef.current?.setMap(null);
    routeLineRef.current = null;
    routeOverlayRefs.current.forEach((overlay) => overlay.setMap(null));
    routeOverlayRefs.current = [];

    if (!routePreview) {
      return;
    }

    const animatedRoutePath = getPartialRoutePath(
      routePreview.path,
      routeDrawProgress,
    );
    const routeHead = animatedRoutePath[animatedRoutePath.length - 1];

    routeLineRef.current = new kakaoMaps.Polyline({
      clickable: false,
      map,
      path: animatedRoutePath.map(
        (point) => new kakaoMaps.LatLng(point.lat, point.lng),
      ),
      strokeColor: routeStrokeColor,
      strokeOpacity: 0.95,
      strokeStyle: "solid",
      strokeWeight: 8,
      zIndex: 35,
    });

    [
      routePreview.path[0],
      routeDrawProgress >= 1
        ? routePreview.path[routePreview.path.length - 1]
        : null,
    ].forEach((point, index) => {
      if (!point) {
        return;
      }

      const routeCap = document.createElement("span");
      routeCap.setAttribute(
        "aria-label",
        index === 0 ? "경로 시작점" : "경로 도착점",
      );
      routeCap.style.display = "block";
      routeCap.style.width = "14px";
      routeCap.style.height = "14px";
      routeCap.style.border = "3px solid #ffffff";
      routeCap.style.borderRadius = "9999px";
      routeCap.style.background = routeStrokeColor;
      routeCap.style.boxShadow = "0 4px 12px rgba(15, 23, 42, 0.16)";
      routeCap.style.pointerEvents = "none";

      routeOverlayRefs.current.push(
        new kakaoMaps.CustomOverlay({
          content: routeCap,
          map,
          position: new kakaoMaps.LatLng(point.lat, point.lng),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 36,
        }),
      );
    });

    if (routeHead) {
      const routeHeadMarker = document.createElement("span");
      routeHeadMarker.setAttribute("aria-label", "경로 진행 지점");
      routeHeadMarker.style.display = "block";
      routeHeadMarker.style.width = "18px";
      routeHeadMarker.style.height = "18px";
      routeHeadMarker.style.border = "4px solid #ffffff";
      routeHeadMarker.style.borderRadius = "9999px";
      routeHeadMarker.style.background = routeStrokeColor;
      routeHeadMarker.style.boxShadow =
        "0 0 0 7px rgba(253, 182, 29, 0.22), 0 8px 18px rgba(15, 23, 42, 0.2)";
      routeHeadMarker.style.pointerEvents = "none";

      routeOverlayRefs.current.push(
        new kakaoMaps.CustomOverlay({
          content: routeHeadMarker,
          map,
          position: new kakaoMaps.LatLng(routeHead.lat, routeHead.lng),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 42,
        }),
      );
    }

    return () => {
      routeLineRef.current?.setMap(null);
      routeLineRef.current = null;
      routeOverlayRefs.current.forEach((overlay) => overlay.setMap(null));
      routeOverlayRefs.current = [];
    };
  }, [isKakaoMapReady, routeDrawProgress, routePreview]);

  return (
    <section
      data-kakao-map-ready={isKakaoMapReady}
      className={cn(
        "relative overflow-hidden bg-white dark:bg-zinc-950",
        isFullBleed
          ? "h-full"
          : "border-border rounded-3xl border shadow-sm dark:border-white/10",
        className,
      )}
    >
      {isKakaoMapReady ? (
        <div ref={mapContainerRef} className="absolute inset-0" />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_46%_42%,rgba(255,179,25,0.22),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(246,248,251,0.96))] dark:bg-[radial-gradient(circle_at_46%_42%,rgba(255,179,25,0.2),transparent_28%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))]" />
          <div className="absolute inset-0 [background-image:linear-gradient(rgba(100,116,139,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.14)_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.38]" />
        </>
      )}

      <div className="pointer-events-none relative h-full min-h-[420px] p-5 sm:p-7">
        {!isKakaoMapReady && (
          <>
            <div className="bg-brand/15 pointer-events-none absolute top-[17%] left-[14%] h-24 w-24 rounded-full blur-2xl" />
            <div className="absolute right-[16%] bottom-[18%] h-32 w-32 rounded-full bg-orange-300/20 blur-3xl" />
          </>
        )}

        {!isKakaoMapReady &&
          stores.map((store, index) => {
            const isSelected = selectedStoreId === store.id;

            return (
              <button
                key={store.id}
                type="button"
                onClick={() => onSelectStore(store.id)}
                aria-pressed={isSelected}
                className={cn(
                  "pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold shadow-sm transition",
                  isSelected
                    ? "border-brand bg-brand text-white"
                    : "text-text-secondary hover:border-brand/50 hover:text-text-primary border-white bg-white dark:border-white/15 dark:bg-zinc-900 dark:text-gray-200",
                )}
                style={getFallbackMarkerStyle(store, stores, index)}
              >
                <MapPin size={15} />
                {store.name.replace("VITA ", "")}
              </button>
            );
          })}

        {selectedStore && selectedStoreCard && (
          <button
            type="button"
            className="pointer-events-auto absolute inset-0 z-30 cursor-default"
            aria-label="매장 정보 카드 닫기"
            onClick={onSelectedStoreCardClose}
          />
        )}

        {selectedStore &&
          selectedStoreCard &&
          (selectedStoreCardPosition || !isKakaoMapReady) && (
            <div
              className={cn(
                "pointer-events-auto absolute z-40 w-[min(320px,calc(100%-24px))]",
                isRouteCardDocked
                  ? "right-3 bottom-6 md:right-6 md:bottom-6"
                  : "-translate-x-1/2 -translate-y-[calc(100%+18px)]",
              )}
              onClick={(event) => event.stopPropagation()}
              style={
                isRouteCardDocked
                  ? undefined
                  : (selectedStoreCardPosition ??
                    getFallbackMarkerStyle(
                      selectedStore,
                      stores,
                      stores.findIndex(
                        (store) => store.id === selectedStore.id,
                      ),
                    ))
              }
            >
              {selectedStoreCard}
            </div>
          )}

        {searchPoint && onSearchFromMapPoint && (
          <button
            type="button"
            onClick={() => {
              onSelectedStoreCardClose?.();
              onSearchFromMapPoint();
            }}
            disabled={isSearchFromMapPointLoading}
            className="bg-brand hover:bg-brand-hover pointer-events-auto absolute bottom-6 left-1/2 z-30 flex h-10 -translate-x-1/2 items-center gap-2 rounded-full px-5 text-sm font-extrabold whitespace-nowrap text-white shadow-lg transition disabled:cursor-wait disabled:opacity-80"
          >
            <RotateCcw
              size={16}
              className={cn(isSearchFromMapPointLoading && "animate-spin")}
            />
            이 지역에서 재검색
          </button>
        )}
      </div>
    </section>
  );
};
