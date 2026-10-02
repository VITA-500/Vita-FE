"use client";

import { useState } from "react";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import type { StoreLocation } from "@/features/store/types";
import { showToast } from "@/shared/ui/ToastProvider";

/** 매장 방문 예약: 로그인 확인, 예약 확인 모달, 완료 안내 */
export const useStoreReservation = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthUser();
  const [reservationStore, setReservationStore] =
    useState<StoreLocation | null>(null);
  const [isLoginRequiredModalOpen, setIsLoginRequiredModalOpen] =
    useState(false);
  const [isToastBackdropVisible, setIsToastBackdropVisible] = useState(false);

  const handleReservationConfirm = () => {
    if (!reservationStore) {
      return;
    }

    setReservationStore(null);
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

    setReservationStore(store);
  };

  return {
    cancelReservation: () => setReservationStore(null),
    closeLoginRequiredModal: () => setIsLoginRequiredModalOpen(false),
    handleReservationConfirm,
    handleReserve,
    isLoginRequiredModalOpen,
    isToastBackdropVisible,
    reservationStore,
  };
};
