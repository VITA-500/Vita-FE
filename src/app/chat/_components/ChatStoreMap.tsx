"use client";

import { LocateFixed, Tag } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ChatStoreResultCard } from "@/features/chat/components/ChatStoreResultCard";
import { StoreMapPreview } from "@/features/store/map/components/StoreMapPreview";
import { StorePanelModals } from "@/features/store/reservation/components/StorePanelModals";
import { useStoreReservation } from "@/features/store/reservation/hooks/useStoreReservation";
import {
  CHAT_STORE_RADIUS_KM,
  findChatStoreMap,
  getMatchedServices,
  readCachedChatLocation,
} from "@/features/chat/lib/chatStoreMap";
import { ChatCardRail } from "@/features/chat/components/ChatCardRail";
import {
  getChatStoreDistanceLabel,
  getChatStoreMapOriginPoint,
  getChatStoreMapUserLocation,
} from "@/features/chat/lib/chatStoreMapOrigin";
import type { ChatStoreMap as ChatStoreMapData } from "@/features/chat/types";
import {
  buildMarkerColorInfoById,
  buildMarkerLabelById,
  buildStoreServiceColorByValue,
  KNOWN_CONSULT_SERVICES,
  KNOWN_PROVIDED_SERVICES,
} from "@/entities/store";
import type { LatLng } from "@/shared/lib/geo";
import { showToast } from "@/shared/providers/ToastProvider";

const MAX_CHAT_STORE_COUNT = 5;
const LEGACY_DEFAULT_CHAT_STORE_ORIGIN_LABEL = "선릉역 부근";

type ChatStoreMapProps = {
  storeMap: ChatStoreMapData;
};

const toStoreLocation = (
  store: ChatStoreMapData["stores"][number],
  storeMap: ChatStoreMapData,
) => ({
  ...store,
  address: store.address || "주소 정보 확인 중",
  benefitCategory: store.benefitCategory ?? storeMap.category ?? undefined,
  benefitId: store.benefitId ?? storeMap.benefitId ?? undefined,
  phone: store.phone || "",
  storeType: storeMap.type ?? undefined,
});

/**
 * 채팅 답변 안의 낮은 지도(약 300px)용 핀 맞춤 여백.
 * 매장 지도 화면의 기본 여백(위 120px·오른쪽 96px, 검색창·목록용)을 그대로 쓰면 핀이 들어갈 공간이 좁아
 * 지도가 크게 축소되고 핀이 작게 보인다. 위는 핀 높이, 오른쪽 아래는 지도 버튼만큼만 남긴다.
 */
const getChatMapPinFitPadding = () => ({
  bottom: 28,
  left: 28,
  right: 52,
  top: 52,
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
  const isPlaceOrigin = storeMap.originSource === "place";
  /** 질문에 나온 서비스(예: 휴대폰상담). 이 서비스가 되는 매장을 카드·핀에서 강조한다. */
  const activeServices = useMemo(
    () => storeMap.activeServices?.slice(0, 4) ?? [],
    [storeMap.activeServices],
  );
  // BE 또는 조회 유틸이 정한 추천 순서를 그대로 유지한다.
  const stores = useMemo(
    () =>
      storeMap.stores
        .slice(0, MAX_CHAT_STORE_COUNT)
        .map((store) => toStoreLocation(store, storeMap)),
    [storeMap],
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
    point: LatLng;
  } | null>(null);
  /** 같은 카드를 다시 눌러도 카드 레일 위치를 다시 맞추기 위한 요청 횟수. */
  const [cardFocusSignal, setCardFocusSignal] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const reservation = useStoreReservation();
  // BE origin은 현재 위치 기준일 때만 내 위치로 쓴다. 장소 기준이면 내 위치 버튼을 눌렀을 때만 보여준다.
  const userLocation = getChatStoreMapUserLocation(storeMap, currentLocation);
  // 장소 기준 검색이면 기준점(예: "왕십리")을 따로 찍고, 카드에 내 위치에서의 거리도 함께 보여준다.
  // 내 위치는 내 위치 버튼으로 받은 값, 없으면 질문을 보낼 때 받아 둔 위치를 쓴다(파란 점은 버튼을 눌렀을 때만).
  const originPoint = useMemo(
    () => getChatStoreMapOriginPoint(storeMap),
    [storeMap],
  );
  const [cachedLocation] = useState(() => readCachedChatLocation());
  const distanceBaseLocation = currentLocation ?? cachedLocation;
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

  const focusMapOn = (point: LatLng) => {
    setMapFocusRequest((request) => ({
      count: (request?.count ?? 0) + 1,
      point: { lat: point.lat, lng: point.lng },
    }));
  };

  const focusStoreCard = () => {
    setCardFocusSignal((signal) => signal + 1);
  };

  const handleSelectCard = (storeId: string) => {
    const store = stores.find((item) => item.id === storeId);

    setSelectedStoreId(storeId);
    focusStoreCard();
    if (store) focusMapOn(store);
  };

  const researchStoresAround = async (point: LatLng) => {
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
    const store = stores.find((item) => item.id === storeId);

    setSelectedStoreId(storeId);
    // 카드를 눌렀을 때처럼 지도도 그 매장으로 옮긴다.
    if (store) focusMapOn(store);
    // 핀을 누르면 해당 카드가 레일 중앙 쪽으로 자연스럽게 이동한다.
    focusStoreCard();
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
            {storeMap.originLabel ?? LEGACY_DEFAULT_CHAT_STORE_ORIGIN_LABEL})
            기준으로 찾았어요.
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
      {isPlaceOrigin && storeMap.originLabel && (
        <div className="border-b border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-zinc-950 dark:text-gray-300">
          {storeMap.originLabel} 기준으로 가까운 매장을 찾았어요.
        </div>
      )}
      <div className="h-[300px] sm:h-[340px]">
        <StoreMapPreview
          className="h-full rounded-none border-0 shadow-none"
          fitTarget={fitTarget}
          isCompact
          getPinFitPadding={getChatMapPinFitPadding}
          isUserLocationLoading={isLocating}
          onFocusUserLocation={handleFocusUserLocation}
          markerLabelById={markerLabelById}
          markerColorInfoById={markerColorInfoById}
          selectedStore={selectedStore}
          selectedStoreId={selectedStore?.id ?? ""}
          stores={stores}
          userLocation={userLocation}
          originPoint={originPoint}
          onSelectStore={handleSelectPin}
        />
      </div>

      <div className="border-t border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-zinc-950">
        {/* 제휴 매장은 서비스 대신 혜택명이 들어 있어 "○○ 가능한 매장" 안내가 의미가 없다. */}
        {activeServices.length > 0 && storeMap.type !== "PARTNER" && (
          <div className="mb-2 flex items-start gap-2 px-1 text-xs leading-5 font-bold text-gray-500 dark:text-gray-400">
            <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0">
              {hasFullMatchStore
                ? `${activeServices.join(", ")} 가능한 매장을 먼저 보여드려요.`
                : `반경 ${CHAT_STORE_RADIUS_KM}km 안에 ${activeServices.join(", ")} 가능한 매장이 없어 가까운 매장을 보여드려요.`}
            </span>
          </div>
        )}
        <ChatCardRail
          items={stores}
          ariaLabel={`주변 매장 ${stores.length}곳`}
          itemLabel="매장"
          // 매장명·영업 상태·거리가 한 카드에 들어가도록 요금제 카드보다 조금 넓힌다.
          itemMinWidthClassName="lg:min-w-[264px]"
          getKey={(store) => store.id}
          focusedItemKey={selectedStore?.id}
          focusSignal={cardFocusSignal}
          renderItem={(store, index) => (
            <ChatStoreResultCard
              activeServices={activeServices}
              distanceLabel={getChatStoreDistanceLabel({
                distanceText: store.distanceText,
                storeMap,
                storePoint: store,
                userLocation: distanceBaseLocation,
              })}
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
              onReserve={reservation.handleReserve}
              onSelect={() => handleSelectCard(store.id)}
            />
          )}
        />
      </div>
      <StorePanelModals
        isLocationPermissionModalOpen={false}
        isLocationRequesting={false}
        isLoginRequiredModalOpen={reservation.isLoginRequiredModalOpen}
        isReservationSubmitting={reservation.isReservationSubmitting}
        maxReservationDate={reservation.maxReservationDate}
        minReservationDate={reservation.minReservationDate}
        onDismissLocationPermission={() => undefined}
        onLoginRequiredClose={reservation.closeLoginRequiredModal}
        onRequestUserLocation={() => undefined}
        onReservationCancel={reservation.cancelReservation}
        onReservationConfirm={reservation.handleReservationConfirm}
        onReservationDateChange={reservation.setReservationDate}
        onReservationTimeChange={reservation.setReservationTime}
        reservationDate={reservation.reservationDate}
        reservationStore={reservation.reservationStore}
        reservationTime={reservation.reservationTime}
      />
    </div>
  );
};
