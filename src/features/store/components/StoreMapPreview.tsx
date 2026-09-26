"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { useKakaoMapReady } from "@/features/store/hooks/useKakaoMapReady";
import type { UserLocation } from "@/features/store/lib/geo";
import type { StoreLocation } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

const clampPercent = (value: number) => Math.min(88, Math.max(12, value));

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

type MapPoint = {
  lat: number;
  lng: number;
};

type KakaoMapEventApi = {
  addListener: (
    target: KakaoMap,
    eventName: "dragend",
    callback: () => void,
  ) => void;
  removeListener: (
    target: KakaoMap,
    eventName: "dragend",
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

type MapOverlayHandle = {
  marker?: KakaoMarker;
  overlay: KakaoCustomOverlay;
  cleanup?: () => void;
};

type StoreMapPreviewProps = {
  className?: string;
  isFullBleed?: boolean;
  selectedStore?: StoreLocation;
  selectedStoreId: string;
  stores: StoreLocation[];
  searchPoint?: MapPoint | null;
  userLocation?: UserLocation | null;
  onMapPointSelect?: (point: MapPoint) => void;
  onSearchFromMapPoint?: () => void;
  onSelectStore: (storeId: string) => void;
};

export const StoreMapPreview = ({
  className,
  isFullBleed = false,
  onSelectStore,
  selectedStore,
  selectedStoreId,
  searchPoint,
  stores,
  userLocation,
  onMapPointSelect,
  onSearchFromMapPoint,
}: StoreMapPreviewProps) => {
  const isKakaoMapReady = useKakaoMapReady();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlayRefs = useRef<MapOverlayHandle[]>([]);
  const searchPointRef = useRef<SearchPointRef>(undefined);

  useEffect(() => {
    if (!isKakaoMapReady || !mapContainerRef.current || !window.kakao?.maps) {
      return;
    }

    const kakaoMaps = window.kakao.maps;
    const centerStore = selectedStore ?? stores[0];

    if (!searchPoint && !centerStore) {
      return;
    }

    const center = searchPoint
      ? new kakaoMaps.LatLng(searchPoint.lat, searchPoint.lng)
      : new kakaoMaps.LatLng(centerStore.lat, centerStore.lng);

    const isNewMap = mapRef.current === null;
    const map =
      mapRef.current ??
      new kakaoMaps.Map(mapContainerRef.current, {
        center,
        level: 4,
      });
    const shouldRecenterBySearchPoint =
      Boolean(searchPoint) && searchPointRef.current !== searchPoint;

    mapRef.current = map;
    searchPointRef.current = searchPoint;

    if (isNewMap || shouldRecenterBySearchPoint) {
      map.setCenter(center);
      map.setLevel(4);
    }

    const mapEventApi = kakaoMaps.event as unknown as KakaoMapEventApi;
    const handleMapDragEnd = () => {
      const movedCenter = (map as KakaoMapWithCenter).getCenter();

      onMapPointSelect?.({
        lat: movedCenter.getLat(),
        lng: movedCenter.getLng(),
      });
    };

    if (onMapPointSelect) {
      mapEventApi.addListener(map, "dragend", handleMapDragEnd);
    }

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
      currentLocationMarker.setAttribute("aria-label", "현재 위치");

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

    return () => {
      if (onMapPointSelect) {
        mapEventApi.removeListener(map, "dragend", handleMapDragEnd);
      }

      overlayRefs.current.forEach(({ cleanup, overlay }) => {
        cleanup?.();
        overlay.setMap(null);
      });
      overlayRefs.current = [];
    };
  }, [
    isKakaoMapReady,
    onSelectStore,
    onMapPointSelect,
    onSearchFromMapPoint,
    selectedStore,
    selectedStoreId,
    searchPoint,
    stores,
    userLocation,
  ]);

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

        {searchPoint && onSearchFromMapPoint && (
          <button
            type="button"
            onClick={onSearchFromMapPoint}
            className="bg-brand hover:bg-brand-hover pointer-events-auto absolute bottom-6 left-1/2 z-30 h-10 -translate-x-1/2 rounded-full px-5 text-sm font-extrabold whitespace-nowrap text-white shadow-lg transition"
          >
            현 위치에서 검색
          </button>
        )}
      </div>
    </section>
  );
};
