"use client";

import { useState } from "react";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import {
  getNextReservationDateValue,
  getReservationDateValue,
} from "@/features/store/lib/reservationTimeSlots";
import { storeService } from "@/features/store/lib/storeService";
import type { StoreLocation } from "@/features/store/types";
import { ApiError } from "@/shared/api/http";
import { showToast } from "@/shared/ui/ToastProvider";

/** 매장 방문 예약: 로그인 확인, 예약 확인 모달, 완료 안내 */
export const useStoreReservation = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthUser();
  const [reservationStore, setReservationStore] =
    useState<StoreLocation | null>(null);
  const [reservationDate, setReservationDate] = useState(
    getReservationDateValue,
  );
  const [reservationTime, setReservationTime] = useState("");
  const [isReservationSubmitting, setIsReservationSubmitting] = useState(false);
  const [isLoginRequiredModalOpen, setIsLoginRequiredModalOpen] =
    useState(false);
  const [isToastBackdropVisible, setIsToastBackdropVisible] = useState(false);

  const handleReservationConfirm = async () => {
    if (!reservationStore) {
      return;
    }

    if (!reservationTime) {
      showToast("예약할 시간대를 선택해 주세요.");
      return;
    }

    setIsReservationSubmitting(true);
    try {
      await storeService.reserveStore({
        date: reservationDate,
        storeId: reservationStore.id,
        time: reservationTime,
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "예약을 완료하지 못했어요.";

      showToast(message);
      setIsReservationSubmitting(false);
      return;
    }

    setReservationStore(null);
    setReservationTime("");
    setIsReservationSubmitting(false);
    setIsToastBackdropVisible(true);
    showToast("예약이 완료되었습니다.");

    window.setTimeout(() => {
      setIsToastBackdropVisible(false);
    }, 1700);
  };
  const handleReserve = (store: StoreLocation) => {
    if (isAuthLoading) {
      showToast("로그인 상태를 확인하고 있어요.");
      return;
    }

    if (!isAuthenticated) {
      setIsLoginRequiredModalOpen(true);
      return;
    }

    setReservationDate(getReservationDateValue());
    setReservationTime("");
    setReservationStore(store);
  };

  return {
    cancelReservation: () => {
      if (isReservationSubmitting) return;
      setReservationStore(null);
      setReservationTime("");
    },
    closeLoginRequiredModal: () => setIsLoginRequiredModalOpen(false),
    handleReservationConfirm,
    handleReserve,
    isLoginRequiredModalOpen,
    isReservationSubmitting,
    isToastBackdropVisible,
    minReservationDate: getReservationDateValue(),
    maxReservationDate: getNextReservationDateValue(),
    reservationDate,
    reservationStore,
    reservationTime,
    setReservationDate,
    setReservationTime,
  };
};
