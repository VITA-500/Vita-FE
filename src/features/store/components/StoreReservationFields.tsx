import type { buildReservationTimeSlots } from "@/features/store/lib/reservationTimeSlots";
import { CalendarDateField } from "@/shared/ui/CalendarDateField";

type StoreReservationFieldsProps = {
  maxReservationDate: string;
  minReservationDate: string;
  onReservationDateChange: (date: string) => void;
  onReservationTimeChange: (time: string) => void;
  reservationDate: string;
  reservationSlots: ReturnType<typeof buildReservationTimeSlots>;
  reservationTime: string;
};

/** 방문 예약 입력: 방문 날짜, 예약 가능 시간(30분 단위), 안내 문구. 예약 모달과 모바일 바텀 시트가 함께 쓴다. */
export const StoreReservationFields = ({
  maxReservationDate,
  minReservationDate,
  onReservationDateChange,
  onReservationTimeChange,
  reservationDate,
  reservationSlots,
  reservationTime,
}: StoreReservationFieldsProps) => (
  <div className="space-y-4">
    <label className="block">
      <span className="text-text-secondary text-xs font-extrabold">
        방문 날짜
      </span>
      <CalendarDateField
        ariaLabel="방문 날짜"
        value={reservationDate}
        min={minReservationDate}
        max={maxReservationDate}
        onChange={onReservationDateChange}
        className="mt-2"
      />
    </label>
    <div>
      <p className="text-text-secondary text-xs font-extrabold">
        예약 가능 시간
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {reservationSlots.map((slot) => (
          <button
            key={slot.value}
            type="button"
            disabled={slot.isPast}
            onClick={() => onReservationTimeChange(slot.value)}
            className={
              reservationTime === slot.value && !slot.isPast
                ? "bg-brand flex h-9 items-center justify-center rounded-xl text-xs font-extrabold text-white"
                : "border-border text-text-secondary hover:border-brand/50 hover:text-brand flex h-9 items-center justify-center rounded-xl border text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-gray-300"
            }
          >
            {slot.label}
          </button>
        ))}
      </div>
    </div>
    <p className="text-text-secondary text-xs leading-5 font-semibold">
      운영시간 기준으로 30분 단위 시간대를 보여드려요. 최종 예약 가능 여부는
      예약 요청 시 한 번 더 확인됩니다.
    </p>
  </div>
);
