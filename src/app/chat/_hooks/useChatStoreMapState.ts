"use client";

import { useMemo, useState } from "react";
import {
  MAX_CHAT_STORE_COUNT,
  toStoreLocation,
} from "../_lib/chatStoreMapView";
import {
  findChatStoreMap,
  getMatchedServices,
  readCachedChatLocation,
} from "@/features/chat";
import { getChatStoreMapUserLocation } from "@/features/chat";
import {
  buildMarkerColorInfoById,
  buildMarkerLabelById,
  buildStoreServiceColorByValue,
  KNOWN_CONSULT_SERVICES,
  KNOWN_PROVIDED_SERVICES,
} from "@/entities/store";
import type { LatLng } from "@/shared/lib/geo";
import { showToast } from "@/shared/providers/ToastProvider";
import type { ChatStoreMap as ChatStoreMapData } from "@/entities/chat";

/**
 * 답변 속 매장 지도의 상태: 보여줄 매장, 선택한 매장, 지도·카드 맞춤 요청, 내 위치, 핀 색·글자.
 * 화면은 ChatStoreMap이 그린다.
 */
export const useChatStoreMapState = (
  initialStoreMap: ChatStoreMapData,
  showUserOriginForPlace = false,
) => {
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
  const [cachedLocation] = useState(() => readCachedChatLocation());
  // BE origin은 현재 위치 기준일 때만 내 위치로 쓴다. 장소 기준이면 내 위치 버튼을 눌렀을 때만 보여준다.
  const userLocation = getChatStoreMapUserLocation(
    storeMap,
    currentLocation,
    showUserOriginForPlace ? cachedLocation : null,
  );
  // 장소 기준 검색은 그 장소를 별도 기준 핀으로 다시 표시하지 않는다.
  // 사용자 현재 위치 탐색/길찾기일 때만 userLocation(파란 핀)을 표시한다.
  const distanceBaseLocation =
    currentLocation ||
    (storeMap.originSource === "current" || showUserOriginForPlace
      ? cachedLocation
      : null);
  const selectedStore =
    stores.find((store) => store.id === selectedStoreId) ?? stores[0];
  const storesKey = stores.map((store) => store.id).join(":");
  const initialFitPoints = useMemo(
    () =>
      showUserOriginForPlace && userLocation
        ? [...stores, userLocation]
        : stores,
    [showUserOriginForPlace, stores, userLocation],
  );
  // 처음에는 필요한 기준점 전체를 보이고, 카드 클릭 시 해당 매장으로 확대한다.
  const fitTarget = useMemo(
    () =>
      mapFocusRequest
        ? {
            key: `${storesKey}:focus:${mapFocusRequest.count}`,
            points: [mapFocusRequest.point],
            smooth: false,
            zoomLevel: 2,
            includeUserLocation: false,
          }
        : {
            key: `${storesKey}:${userLocation?.lat ?? ""}:${userLocation?.lng ?? ""}`,
            points: initialFitPoints,
            includeUserLocation: true,
          },
    [initialFitPoints, mapFocusRequest, storesKey, userLocation],
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
          // 장소 기준 + 현재 위치 탐색 의도에서는 매장과 사용자 위치를 함께 다시 맞춘다.
          if (showUserOriginForPlace) {
            setMapFocusRequest(null);
          } else {
            focusMapOn(point);
          }
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

  return {
    activeServices,
    cardFocusSignal,
    distanceBaseLocation,
    fitTarget,
    handleFocusUserLocation,
    handleSelectCard,
    handleSelectPin,
    hasFullMatchStore,
    isDefaultOrigin,
    isLocating,
    isPlaceOrigin,
    markerColorInfoById,
    markerLabelById,
    matchedServicesById,
    selectedStore,
    serviceColorByValue,
    storeMap,
    stores,
    userLocation,
  };
};
