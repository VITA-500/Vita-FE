"use client";

import { useState } from "react";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import {
  getNextReservationDateValue,
  getReservationDateValue,
  reservationApi,
} from "@/entities/reservation";
import type { StoreLocation } from "@/features/store/types";
import { ApiError } from "@/shared/api/http";
import { showToast } from "@/shared/providers/ToastProvider";

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
  // 로그인이 필요해 예약하지 못한 매장. 로그인하고 돌아오면 이 매장 예약을 이어서 연다.
  const [loginRequiredStore, setLoginRequiredStore] =
    useState<StoreLocation | null>(null);
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
      await reservationApi.createReservation({
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
      setLoginRequiredStore(store);
      setIsLoginRequiredModalOpen(true);
      return;
    }

    if (store.storeType === "PARTNER") {
      showToast("제휴 매장은 방문 예약을 이용할 수 없어요.");
      return;
    }

    if (!/^\d+$/.test(store.id)) {
      showToast("이 매장은 예약 정보를 확인할 수 없어요.");
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
    isAuthenticated,
    isAuthLoading,
    isLoginRequiredModalOpen,
    loginRequiredStore,
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
