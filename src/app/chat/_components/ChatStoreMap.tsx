"use client";

import { LocateFixed, Tag } from "lucide-react";
import { useRef } from "react";
import { useChatStoreMapState } from "../_hooks/useChatStoreMapState";
import {
  getChatMapPinFitPadding,
  LEGACY_DEFAULT_CHAT_STORE_ORIGIN_LABEL,
} from "../_lib/chatStoreMapView";
import { ChatCardRail } from "@/features/chat/cards/components/ChatCardRail";
import { ChatStoreResultCard } from "@/features/chat/store/components/ChatStoreResultCard";
import { CHAT_STORE_RADIUS_KM } from "@/features/chat/store/lib/chatStoreMap";
import { getChatStoreDistanceLabel } from "@/features/chat/store/lib/chatStoreMapOrigin";
import { StoreMapPreview } from "@/features/store/map/components/StoreMapPreview";
import { StorePanelModals } from "@/features/store/reservation/components/StorePanelModals";
import { useStoreReservation } from "@/features/store/reservation/hooks/useStoreReservation";
import type { ChatStoreMap as ChatStoreMapData } from "@/entities/chat";

type ChatStoreMapProps = {
  storeMap: ChatStoreMapData;
};

/** 채팅 답변 속 매장 지도 블록: 기준 위치 안내, 지도, 매장 카드 레일, 예약 모달 */
export const ChatStoreMap = ({
  storeMap: initialStoreMap,
}: ChatStoreMapProps) => {
  const {
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
    originPoint,
    selectedStore,
    serviceColorByValue,
    storeMap,
    stores,
    userLocation,
  } = useChatStoreMapState(initialStoreMap);
  const reservation = useStoreReservation();
  const cardRefs = useRef(new Map<string, HTMLElement>());

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
