import { buildReservationTimeSlots } from "@/features/store/lib/reservationTimeSlots";
import type { StoreLocation } from "@/features/store/types";

type UseReservationSlotsParams = {
  onReservationDateChange: (date: string) => void;
  onReservationTimeChange: (time: string) => void;
  reservationDate: string;
  reservationStore: StoreLocation | null;
  reservationTime: string;
};

/**
 * 예약 날짜·시간 선택에 쓰는 시간대 목록과 선택 가능 여부.
 * 날짜를 바꿨을 때 고른 시간이 그 날짜에 없거나 지난 시간이면 시간 선택을 비운다.
 * (데스크톱 예약 모달과 모바일 바텀 시트가 함께 쓴다)
 */
export const useReservationSlots = ({
  onReservationDateChange,
  onReservationTimeChange,
  reservationDate,
  reservationStore,
  reservationTime,
}: UseReservationSlotsParams) => {
  const reservationSlots = buildReservationTimeSlots({
    businessHours: reservationStore?.businessHours,
    date: reservationDate,
  });
  const selectedReservationSlot = reservationSlots.find(
    (slot) => slot.value === reservationTime,
  );
  const isReservationTimeAvailable = Boolean(
    selectedReservationSlot && !selectedReservationSlot.isPast,
  );
  const handleReservationDateChange = (date: string) => {
    const nextSlots = buildReservationTimeSlots({
      businessHours: reservationStore?.businessHours,
      date,
    });
    const nextSelectedSlot = nextSlots.find(
      (slot) => slot.value === reservationTime,
    );

    onReservationDateChange(date);

    if (reservationTime && (!nextSelectedSlot || nextSelectedSlot.isPast)) {
      onReservationTimeChange("");
    }
  };

  return {
    handleReservationDateChange,
    isReservationTimeAvailable,
    reservationSlots,
  };
};
