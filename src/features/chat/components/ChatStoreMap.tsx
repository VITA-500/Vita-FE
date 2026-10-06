"use client";

import { MapPin, Tag } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import { useUserLocation } from "@/features/store/hooks/useUserLocation";
import type { MapPoint } from "@/features/store/lib/mapFit";
import { buildMarkerLabelById } from "@/features/store/lib/storePanelStores";
import {
  buildMarkerColorInfoById,
  buildServiceFilterColorByValue,
} from "@/features/store/lib/markerColors";
import type { StoreLocation } from "@/features/store/types";
import type { ChatStoreMap as ChatStoreMapData } from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";
import { showToast } from "@/shared/ui/ToastProvider";

const MAX_CHAT_STORE_COUNT = 4;

type ChatStoreMapProps = {
  storeMap: ChatStoreMapData;
};

const toStoreLocation = (store: ChatStoreMapData["stores"][number]) => ({
  ...store,
  address: store.address || "주소 정보 확인 중",
  phone: store.phone || "",
});

export const ChatStoreMap = ({ storeMap }: ChatStoreMapProps) => {
  const stores = useMemo(
    () => storeMap.stores.slice(0, MAX_CHAT_STORE_COUNT).map(toStoreLocation),
    [storeMap.stores],
  );
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
  /** 지도를 특정 지점(카드를 누른 매장 핀·내 위치)으로 옮기는 요청. 같은 곳을 다시 눌러도 옮기도록 횟수를 함께 둔다. */
  const [mapFocusRequest, setMapFocusRequest] = useState<{
    count: number;
    point: MapPoint;
  } | null>(null);
  const {
    location: currentLocation,
    requestLocation,
    status: locationStatus,
  } = useUserLocation();
  /** 내 위치 버튼을 눌러 위치를 받는 중이면, 받는 즉시 그 위치로 옮긴다. */
  const shouldFocusLocationRef = useRef(false);
  const userLocation = currentLocation ?? storeMap.origin ?? null;
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const selectedStore =
    stores.find((store) => store.id === selectedStoreId) ?? stores[0];
  const storesKey = stores.map((store) => store.id).join(":");
  // 처음에는 모든 매장 핀이 보이게 맞추고, 카드·내 위치를 누르면 그 지점으로 부드럽게 옮긴다.
  const fitTarget = useMemo(
    () =>
      mapFocusRequest
        ? {
            key: `${storesKey}:focus:${mapFocusRequest.count}`,
            points: [mapFocusRequest.point],
            smooth: true,
          }
        : { key: storesKey, points: stores },
    [mapFocusRequest, stores, storesKey],
  );

  const focusMapOn = (point: MapPoint) => {
    setMapFocusRequest((request) => ({
      count: (request?.count ?? 0) + 1,
      point: { lat: point.lat, lng: point.lng },
    }));
  };

  useEffect(() => {
    if (!shouldFocusLocationRef.current || !currentLocation) return;

    shouldFocusLocationRef.current = false;
    setMapFocusRequest((request) => ({
      count: (request?.count ?? 0) + 1,
      point: currentLocation,
    }));
  }, [currentLocation]);

  useEffect(() => {
    if (!shouldFocusLocationRef.current) return;
    if (locationStatus !== "denied" && locationStatus !== "error") return;

    shouldFocusLocationRef.current = false;
    showToast(
      locationStatus === "denied"
        ? "위치 권한을 허용하면 내 위치를 지도에 표시할 수 있어요."
        : "현재 위치를 가져오지 못했어요.",
    );
  }, [locationStatus]);

  const handleSelectCard = (storeId: string) => {
    const store = stores.find((item) => item.id === storeId);

    setSelectedStoreId(storeId);
    if (store) focusMapOn(store);
  };

  const handleFocusUserLocation = () => {
    // 이미 받은 위치로 먼저 옮기고, 최신 위치를 다시 받아 오면 한 번 더 맞춘다.
    if (userLocation) focusMapOn(userLocation);
    shouldFocusLocationRef.current = true;
    requestLocation();
  };

  const handleSelectPin = (storeId: string) => {
    setSelectedStoreId(storeId);
    // 핀을 누르면 해당 카드가 보이도록 스크롤한다(카드 위치는 선택 여부와 무관해 바로 옮겨도 된다).
    cardRefs.current
      .get(storeId)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  const markerLabelById = useMemo(() => buildMarkerLabelById(stores), [stores]);
  const activeServices = useMemo(
    () => storeMap.activeServices?.slice(0, 4) ?? [],
    [storeMap.activeServices],
  );
  const markerColorInfoById = useMemo(() => {
    const colorByValue = buildServiceFilterColorByValue(
      activeServices.map((service) => ({ label: service, value: service })),
    );

    return buildMarkerColorInfoById({
      activeServiceFilters: activeServices,
      colorByValue,
      stores,
    });
  }, [activeServices, stores]);

  if (stores.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="h-[300px] sm:h-[340px]">
        <StoreMapPreview
          className="h-full rounded-none border-0 shadow-none"
          fitTarget={fitTarget}
          isCompact
          isUserLocationLoading={locationStatus === "requesting"}
          onFocusUserLocation={handleFocusUserLocation}
          markerLabelById={markerLabelById}
          markerColorInfoById={markerColorInfoById}
          selectedStore={selectedStore}
          selectedStoreId={selectedStore?.id ?? ""}
          stores={stores}
          userLocation={userLocation}
          onSelectStore={handleSelectPin}
        />
      </div>

      <div className="border-t border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
        {activeServices.length > 0 && (
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-bold text-gray-500 dark:text-gray-400">
            <Tag className="h-3.5 w-3.5" />
            <span className="truncate">
              {activeServices.join(", ")} 가능 매장을 핀 색상에 반영했어요.
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {stores.map((store, index) => (
            <StoreResultCard
              key={store.id}
              cardRef={(element) => {
                if (element) {
                  cardRefs.current.set(store.id, element);
                } else {
                  cardRefs.current.delete(store.id);
                }
              }}
              index={index}
              isSelected={store.id === selectedStore?.id}
              store={store}
              onSelect={() => handleSelectCard(store.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

type StoreResultCardProps = {
  cardRef: (element: HTMLElement | null) => void;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  store: StoreLocation;
};

const StoreResultCard = ({
  cardRef,
  index,
  isSelected,
  onSelect,
  store,
}: StoreResultCardProps) => (
  <article
    ref={cardRef}
    role="button"
    tabIndex={0}
    aria-pressed={isSelected}
    className={cn(
      "focus-visible:ring-brand/30 min-w-0 cursor-pointer scroll-my-4 rounded-xl border bg-white p-3.5 text-left transition outline-none focus-visible:ring-2 dark:bg-zinc-900",
      isSelected
        ? "border-brand shadow-[0_8px_24px_rgba(253,182,29,0.18)]"
        : "border-gray-200 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20",
    )}
    onClick={onSelect}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect();
      }
    }}
  >
    <div className="mb-3 flex items-start justify-between gap-3">
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs font-black",
          isSelected ? "bg-brand text-white" : "bg-brand/10 text-brand",
        )}
      >
        {String.fromCharCode(65 + index)}
      </span>
      <div className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-text-primary truncate text-sm font-extrabold dark:text-white">
            {store.name}
          </span>
          {store.distanceText && (
            <span className="shrink-0 text-[11px] font-bold text-gray-400">
              {store.distanceText}
            </span>
          )}
        </span>
      </div>
      <MapPin className="text-brand mt-1 h-4 w-4 shrink-0" />
    </div>

    <ServiceBadges store={store} />
  </article>
);

const ServiceBadges = ({ store }: { store: StoreLocation }) => {
  const services = [
    ...(store.consultServices ?? []),
    ...(store.providedServices ?? []),
  ];
  const uniqueServices = Array.from(new Set(services)).slice(0, 4);

  if (uniqueServices.length === 0) {
    return (
      <p className="text-text-secondary truncate text-xs font-medium dark:text-gray-400">
        제공 서비스 확인 중
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {uniqueServices.map((service) => (
        <span
          key={service}
          className="bg-surface-muted text-text-secondary rounded-full px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300"
        >
          {service}
        </span>
      ))}
    </div>
  );
};
