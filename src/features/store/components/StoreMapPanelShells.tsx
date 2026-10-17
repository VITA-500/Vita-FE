"use client";

import { ChevronLeft, X } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { StoreBottomSheet } from "@/features/store/components/StoreBottomSheet";
import { StorePanelModals } from "@/features/store/components/StorePanelModals";
import { StorePanelRouteSearchOverlay } from "@/features/store/components/StorePanelRouteSearchOverlay";
import { StoreReservationFields } from "@/features/store/components/StoreReservationFields";
import { StoreSidePanels } from "@/features/store/components/StoreSidePanels";
import { useReservationSlots } from "@/features/store/hooks/useReservationSlots";
import type { StoreMapPanelModel } from "@/features/store/hooks/useStoreMapPanel";
import { Button } from "@/shared/ui/Button";

type StoreMapPanelShellsProps = Pick<
  StoreMapPanelModel,
  | "cancelReservation"
  | "closeLoginRequiredModal"
  | "dismissLocationPermissionModal"
  | "handleReservationConfirm"
  | "isLocationPermissionModalOpen"
  | "isLoginRequiredModalOpen"
  | "isReservationSubmitting"
  | "isRouteLoading"
  | "isRouteSearchOverlayVisible"
  | "isToastBackdropVisible"
  | "locationStatus"
  | "loginReturnTo"
  | "maxReservationDate"
  | "minReservationDate"
  | "requestUserLocationFromModal"
  | "reservationDate"
  | "saveMapStateBeforeLogin"
  | "reservationStore"
  | "reservationTime"
  | "setReservationDate"
  | "setReservationTime"
> & {
  closeReservationView: () => void;
  closeRouteView: () => void;
  handlePanelHandleClick: () => void;
  infoPanelRef: RefObject<HTMLElement | null>;
  isDesktop: boolean;
  isInfoOpen: boolean;
  isInfoPanelOpen: boolean;
  isListOpen: boolean;
  isMobileRouteView: boolean;
  isMobileReservationView: boolean;
  isRouteViewOpen: boolean;
  isSheetExpanded: boolean;
  listPanelRef: RefObject<HTMLElement | null>;
  onSheetExpandedChange: (isExpanded: boolean) => void;
  sheetRef: RefObject<HTMLElement | null>;
  storeInfoContent: ReactNode;
  storeListContent: ReactNode;
};

export const StoreMapPanelShells = ({
  cancelReservation,
  closeLoginRequiredModal,
  closeReservationView,
  closeRouteView,
  dismissLocationPermissionModal,
  handlePanelHandleClick,
  handleReservationConfirm,
  infoPanelRef,
  isLocationPermissionModalOpen,
  isLoginRequiredModalOpen,
  isDesktop,
  isInfoOpen,
  isInfoPanelOpen,
  isListOpen,
  isMobileReservationView,
  isMobileRouteView,
  isReservationSubmitting,
  isRouteLoading,
  isRouteSearchOverlayVisible,
  isRouteViewOpen,
  isSheetExpanded,
  isToastBackdropVisible,
  listPanelRef,
  locationStatus,
  loginReturnTo,
  maxReservationDate,
  minReservationDate,
  onSheetExpandedChange,
  requestUserLocationFromModal,
  reservationDate,
  saveMapStateBeforeLogin,
  reservationStore,
  reservationTime,
  setReservationDate,
  setReservationTime,
  sheetRef,
  storeInfoContent,
  storeListContent,
}: StoreMapPanelShellsProps) => {
  const {
    handleReservationDateChange,
    isReservationTimeAvailable,
    reservationSlots,
  } = useReservationSlots({
    onReservationDateChange: setReservationDate,
    onReservationTimeChange: setReservationTime,
    reservationDate,
    reservationStore,
    reservationTime,
  });
  const routeViewHeader = (
    <>
      <span className="text-sm font-extrabold text-gray-950 dark:text-white">
        길찾기
      </span>
      <button
        type="button"
        onClick={closeRouteView}
        className="flex h-8 w-8 items-center justify-center rounded-sm text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:hover:bg-white/10 dark:hover:text-gray-200"
        aria-label="길찾기 닫기"
        title="길찾기 닫기"
      >
        <X size={16} />
      </button>
    </>
  );
  const mobileReservationHeader = (
    <div className="border-border flex h-11 shrink-0 items-center gap-1 border-b px-2 dark:border-white/10">
      <button
        type="button"
        onClick={cancelReservation}
        className="flex h-8 w-8 items-center justify-center rounded-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="뒤로 가기"
        title="뒤로 가기"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-0 flex-1 text-sm font-extrabold text-gray-950 dark:text-white">
        방문 예약
      </span>
      <button
        type="button"
        onClick={closeReservationView}
        className="flex h-8 w-8 items-center justify-center rounded-sm text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:hover:bg-white/10 dark:hover:text-gray-200"
        aria-label="예약 닫기"
        title="예약 닫기"
      >
        <X size={16} />
      </button>
    </div>
  );
  const mobileReservationContent = reservationStore ? (
    <div className="break-keep">
      <p className="text-base font-extrabold text-gray-950 dark:text-white">
        {reservationStore.name}
      </p>
      <p className="text-text-secondary mt-1 mb-4 text-xs leading-5 font-semibold">
        {reservationStore.address || "상세 주소 확인 중"}
      </p>
      <StoreReservationFields
        maxReservationDate={maxReservationDate}
        minReservationDate={minReservationDate}
        onReservationDateChange={handleReservationDateChange}
        onReservationTimeChange={setReservationTime}
        reservationDate={reservationDate}
        reservationSlots={reservationSlots}
        reservationTime={reservationTime}
      />
    </div>
  ) : null;
  const mobileReservationFooter = (
    <div className="border-border shrink-0 border-t px-5 py-3 dark:border-white/10">
      <Button
        fullWidth
        onClick={handleReservationConfirm}
        disabled={!isReservationTimeAvailable}
        isLoading={isReservationSubmitting}
      >
        예약하기
      </Button>
    </div>
  );
  const desktopReservationContent = reservationStore ? (
    <div className="border-border mt-5 border-t pt-5 break-keep">
      <div className="mb-4">
        <p className="text-sm font-extrabold text-gray-950 dark:text-white">
          방문 예약
        </p>
        <p className="text-text-secondary mt-1 text-xs leading-5 font-semibold">
          {reservationStore.name} 방문 시간을 선택해 주세요.
        </p>
      </div>
      <StoreReservationFields
        maxReservationDate={maxReservationDate}
        minReservationDate={minReservationDate}
        onReservationDateChange={handleReservationDateChange}
        onReservationTimeChange={setReservationTime}
        reservationDate={reservationDate}
        reservationSlots={reservationSlots}
        reservationTime={reservationTime}
      />
      <Button
        fullWidth
        className="mt-4"
        onClick={handleReservationConfirm}
        disabled={!isReservationTimeAvailable}
        isLoading={isReservationSubmitting}
      >
        예약하기
      </Button>
    </div>
  ) : null;
  const mobileRouteHeader = (
    <div className="border-border flex h-11 shrink-0 items-center justify-between gap-3 border-b px-5 dark:border-white/10">
      {routeViewHeader}
    </div>
  );
  const routeViewContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-border flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4 dark:border-white/10">
        {routeViewHeader}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-8">
        {storeInfoContent}
      </div>
    </div>
  );

  const shell = isDesktop ? (
    <StoreSidePanels
      infoContent={
        <>
          {storeInfoContent}
          {!isRouteViewOpen && desktopReservationContent}
        </>
      }
      infoPanelRef={infoPanelRef}
      isInfoOpen={isInfoPanelOpen}
      isListOpen={isListOpen}
      listContent={isRouteViewOpen ? routeViewContent : storeListContent}
      listLabel={isRouteViewOpen ? "길찾기 정보" : "매장 목록"}
      listPanelRef={listPanelRef}
      onHandleClick={handlePanelHandleClick}
    />
  ) : (
    <StoreBottomSheet
      infoContent={
        isMobileReservationView ? mobileReservationContent : storeInfoContent
      }
      infoFooter={isMobileReservationView ? mobileReservationFooter : undefined}
      infoHeader={
        isMobileReservationView
          ? mobileReservationHeader
          : isMobileRouteView
            ? mobileRouteHeader
            : undefined
      }
      infoHeightClassName={
        isMobileReservationView
          ? "h-[72%]"
          : isMobileRouteView
            ? "h-[50%]"
            : undefined
      }
      canClose={!isMobileRouteView && !isMobileReservationView}
      isExpanded={isSheetExpanded}
      onExpandedChange={onSheetExpandedChange}
      isInfoOpen={isInfoOpen}
      isListOpen={isListOpen}
      listContent={storeListContent}
      onHandleClick={handlePanelHandleClick}
      sheetRef={sheetRef}
    />
  );

  return (
    <>
      {shell}

      {isToastBackdropVisible && (
        <div
          className="pointer-events-none fixed inset-0 z-[990] bg-gray-950/20 transition-opacity"
          aria-hidden="true"
        />
      )}

      {isRouteSearchOverlayVisible && (
        <StorePanelRouteSearchOverlay isRouteLoading={isRouteLoading} />
      )}

      <StorePanelModals
        isReservationModalEnabled={false}
        isLocationPermissionModalOpen={isLocationPermissionModalOpen}
        isLocationRequesting={locationStatus === "requesting"}
        isLoginRequiredModalOpen={isLoginRequiredModalOpen}
        isReservationSubmitting={isReservationSubmitting}
        loginReturnTo={loginReturnTo}
        maxReservationDate={maxReservationDate}
        minReservationDate={minReservationDate}
        onBeforeLogin={saveMapStateBeforeLogin}
        onDismissLocationPermission={dismissLocationPermissionModal}
        onLoginRequiredClose={closeLoginRequiredModal}
        onRequestUserLocation={requestUserLocationFromModal}
        onReservationCancel={cancelReservation}
        onReservationConfirm={handleReservationConfirm}
        onReservationDateChange={setReservationDate}
        onReservationTimeChange={setReservationTime}
        reservationDate={reservationDate}
        reservationStore={reservationStore}
        reservationTime={reservationTime}
      />
    </>
  );
};
