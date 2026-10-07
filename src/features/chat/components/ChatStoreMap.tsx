"use client";

import { LocateFixed, MapPin, Tag } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { StoreMapPreview } from "@/features/store/components/StoreMapPreview";
import type { MapPoint } from "@/features/store/lib/mapFit";
import { buildMarkerLabelById } from "@/features/store/lib/storePanelStores";
import {
  buildMarkerColorInfoById,
  buildStoreServiceColorByValue,
  getServiceFilterColor,
} from "@/features/store/lib/markerColors";
import {
  KNOWN_CONSULT_SERVICES,
  KNOWN_PROVIDED_SERVICES,
} from "@/features/store/lib/serviceKeywords";
import type { StoreLocation } from "@/features/store/types";
import {
  CHAT_STORE_RADIUS_KM,
  DEFAULT_CHAT_STORE_ORIGIN_LABEL,
  findChatStoreMap,
  getMatchedServices,
  rankStoresByServices,
} from "@/features/chat/lib/chatStoreMap";
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

export const ChatStoreMap = ({
  storeMap: initialStoreMap,
}: ChatStoreMapProps) => {
  /** 기본 위치로 찾은 뒤 내 위치로 다시 찾으면 그 결과로 바꿔 보여준다. */
  const [researchedStoreMap, setResearchedStoreMap] =
    useState<ChatStoreMapData | null>(null);
  const storeMap = researchedStoreMap ?? initialStoreMap;
  // 위치를 못 받아 기본 위치로 찾은 결과. 기본 위치를 "내 위치"처럼 보여주지 않는다.
  const isDefaultOrigin = storeMap.originSource === "default";
  /** 질문에 나온 서비스(예: 휴대폰상담). 이 서비스가 되는 매장을 카드·핀에서 강조한다. */
  const activeServices = useMemo(
    () => storeMap.activeServices?.slice(0, 4) ?? [],
    [storeMap.activeServices],
  );
  // 요청 서비스가 되는 매장을 앞으로(예전에 저장된 답변·BE storeMap에도 같은 순서 적용).
  const stores = useMemo(
    () =>
      rankStoresByServices(storeMap.stores, activeServices)
        .slice(0, MAX_CHAT_STORE_COUNT)
        .map(toStoreLocation),
    [activeServices, storeMap.stores],
  );
  const matchedServicesById = useMemo(
    () =>
      new Map(
        stores.map((store) => [
          store.id,
          getMatchedServices(store, activeServices),
        ]),
      ),
    [activeServices, stores],
  );
  const hasFullMatchStore =
    activeServices.length > 0 &&
    stores.some(
      (store) =>
        matchedServicesById.get(store.id)?.length === activeServices.length,
    );
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
  /** 지도를 특정 지점(카드를 누른 매장 핀·내 위치)으로 옮기는 요청. 같은 곳을 다시 눌러도 옮기도록 횟수를 함께 둔다. */
  const [mapFocusRequest, setMapFocusRequest] = useState<{
    count: number;
    point: MapPoint;
  } | null>(null);
  const [currentLocation, setCurrentLocation] = useState<MapPoint | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const userLocation =
    currentLocation ?? (isDefaultOrigin ? null : (storeMap.origin ?? null));
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

  const handleSelectCard = (storeId: string) => {
    const store = stores.find((item) => item.id === storeId);

    setSelectedStoreId(storeId);
    if (store) focusMapOn(store);
  };

  const researchStoresAround = async (point: MapPoint) => {
    const nextStoreMap = await findChatStoreMap({
      activeServices: storeMap.activeServices,
      origin: point,
      originSource: "current",
    }).catch(() => null);

    setIsLocating(false);

    if (!nextStoreMap) {
      focusMapOn(point);
      showToast("내 위치 주변에서 매장을 찾지 못했어요.");
      return;
    }

    setResearchedStoreMap(nextStoreMap);
    setSelectedStoreId(nextStoreMap.stores[0]?.id ?? "");
    setMapFocusRequest(null);
    showToast("내 위치 기준으로 매장을 다시 찾았어요.");
  };

  const handleFocusUserLocation = () => {
    // 이미 받은 위치로 먼저 옮기고, 최신 위치를 다시 받아 오면 한 번 더 맞춘다.
    if (userLocation) focusMapOn(userLocation);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showToast("현재 위치를 가져오지 못했어요.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCurrentLocation(point);

        if (!isDefaultOrigin) {
          setIsLocating(false);
          focusMapOn(point);
          return;
        }

        // 기본 위치 기준 결과였다면 받은 위치 주변으로 매장을 다시 찾는다.
        void researchStoresAround(point);
      },
      (error) => {
        setIsLocating(false);
        showToast(
          error.code === error.PERMISSION_DENIED
            ? "위치 권한을 허용하면 내 위치를 지도에 표시할 수 있어요."
            : "현재 위치를 가져오지 못했어요.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 1000 * 60 * 3, timeout: 8000 },
    );
  };

  const handleSelectPin = (storeId: string) => {
    setSelectedStoreId(storeId);
    // 핀을 누르면 해당 카드가 보이도록 스크롤한다(카드 위치는 선택 여부와 무관해 바로 옮겨도 된다).
    cardRefs.current
      .get(storeId)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  const markerLabelById = useMemo(() => buildMarkerLabelById(stores), [stores]);
  // 서비스별 색은 매장 지도와 같은 규칙(상담 가나다순 → 제공 가나다순)·같은 서비스 목록으로 정한다.
  // 그래서 같은 서비스는 매장 지도 필터 뱃지·핀과 같은 색이 된다(채팅 핀·카드 뱃지도 같은 색).
  const serviceColorByValue = useMemo(
    () =>
      buildStoreServiceColorByValue(
        [
          ...KNOWN_CONSULT_SERVICES,
          ...stores.flatMap((store) => store.consultServices ?? []),
        ],
        [
          ...KNOWN_PROVIDED_SERVICES,
          ...stores.flatMap((store) => store.providedServices ?? []),
        ],
      ),
    [stores],
  );
  const markerColorInfoById = useMemo(
    () =>
      buildMarkerColorInfoById({
        activeServiceFilters: activeServices,
        colorByValue: serviceColorByValue,
        stores,
      }),
    [activeServices, serviceColorByValue, stores],
  );

  if (stores.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 dark:border-white/10 dark:bg-white/[0.03]">
      {isDefaultOrigin && (
        <div className="flex items-center gap-3 border-b border-amber-200/70 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
          <p className="min-w-0 flex-1 leading-5">
            현재 위치를 확인하지 못해 기본 위치(
            {DEFAULT_CHAT_STORE_ORIGIN_LABEL}) 기준으로 찾았어요.
          </p>
          <button
            type="button"
            onClick={handleFocusUserLocation}
            disabled={isLocating}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 font-bold text-amber-900 shadow-sm transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60 dark:bg-white/10 dark:text-amber-100 dark:hover:bg-white/15"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            {isLocating ? "찾는 중" : "내 위치로 다시 찾기"}
          </button>
        </div>
      )}
      <div className="h-[300px] sm:h-[340px]">
        <StoreMapPreview
          className="h-full rounded-none border-0 shadow-none"
          fitTarget={fitTarget}
          isCompact
          isUserLocationLoading={isLocating}
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
          <div className="mb-2 flex items-start gap-2 px-1 text-xs leading-5 font-bold text-gray-500 dark:text-gray-400">
            <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0">
              {hasFullMatchStore
                ? `${activeServices.join(", ")} 가능한 매장을 먼저 보여드려요.`
                : `반경 ${CHAT_STORE_RADIUS_KM}km 안에 ${activeServices.join(", ")} 가능한 매장이 없어 가까운 매장을 보여드려요.`}
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
              matchedServices={matchedServicesById.get(store.id) ?? []}
              serviceColorByValue={serviceColorByValue}
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
  /** 이 매장이 제공하는 activeServices */
  matchedServices: readonly string[];
  /** 요청 서비스별 색(핀과 같은 색) */
  serviceColorByValue: Record<string, string>;
  onSelect: () => void;
  store: StoreLocation;
};

const StoreResultCard = ({
  cardRef,
  index,
  isSelected,
  matchedServices,
  onSelect,
  serviceColorByValue,
  store,
}: StoreResultCardProps) => {
  return (
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

      <ServiceBadges
        matchedServices={matchedServices}
        serviceColorByValue={serviceColorByValue}
        store={store}
      />
    </article>
  );
};

const ServiceBadges = ({
  matchedServices,
  serviceColorByValue,
  store,
}: {
  matchedServices: readonly string[];
  serviceColorByValue: Record<string, string>;
  store: StoreLocation;
}) => {
  // 매장 지도 필터 뱃지와 같은 고정 순서(상담 가나다순 → 제공 가나다순)로 보여준다.
  // serviceColorByValue가 그 순서로 만들어져 있어 키 순서를 그대로 쓴다. 요청 서비스는 자리 이동 없이 색으로만 강조.
  // 개수 제한 없이 모두 보여준다(카드 높이가 달라질 수 있음).
  const serviceOrder = Object.keys(serviceColorByValue);
  const getServiceOrder = (service: string) => {
    const order = serviceOrder.indexOf(service);

    return order === -1 ? serviceOrder.length : order;
  };
  const uniqueServices = Array.from(
    new Set([
      ...(store.consultServices ?? []),
      ...(store.providedServices ?? []),
    ]),
  ).sort((first, second) => getServiceOrder(first) - getServiceOrder(second));

  if (uniqueServices.length === 0) {
    return (
      <p className="text-text-secondary truncate text-xs font-medium dark:text-gray-400">
        제공 서비스 확인 중
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {uniqueServices.map((service) => {
        const isMatched = matchedServices.includes(service);

        return (
          <span
            key={service}
            className={cn(
              "bg-surface-muted text-text-secondary rounded-full border px-2.5 py-1 text-[11px] font-bold dark:bg-white/10 dark:text-gray-300",
              !isMatched && "border-transparent",
            )}
            // 요청한 서비스: 같은 모양에 핀과 같은 색으로 테두리·글자만 강조한다.
            style={
              isMatched
                ? {
                    borderColor:
                      serviceColorByValue[service] ?? getServiceFilterColor(0),
                    color:
                      serviceColorByValue[service] ?? getServiceFilterColor(0),
                  }
                : undefined
            }
          >
            {service}
          </span>
        );
      })}
    </div>
  );
};
