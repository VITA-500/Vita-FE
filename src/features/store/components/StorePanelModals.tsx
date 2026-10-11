import { routes } from "@/shared/constants/routes";
import { buildReservationTimeSlots } from "@/features/store/lib/reservationTimeSlots";
import type { StoreLocation } from "@/features/store/types";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

type StorePanelModalsProps = {
  isLocationPermissionModalOpen: boolean;
  isLocationRequesting: boolean;
  isLoginRequiredModalOpen: boolean;
  isReservationSubmitting: boolean;
  maxReservationDate: string;
  minReservationDate: string;
  onDismissLocationPermission: () => void;
  onLoginRequiredClose: () => void;
  onRequestUserLocation: () => void;
  onReservationCancel: () => void;
  onReservationConfirm: () => void | Promise<void>;
  onReservationDateChange: (date: string) => void;
  onReservationTimeChange: (time: string) => void;
  reservationDate: string;
  reservationStore: StoreLocation | null;
  reservationTime: string;
};

/** 매장 지도 패널의 모달: 위치 허용, 예약 확인, 로그인 필요 */
export const StorePanelModals = ({
  isLocationPermissionModalOpen,
  isLocationRequesting,
  isLoginRequiredModalOpen,
  isReservationSubmitting,
  maxReservationDate,
  minReservationDate,
  onDismissLocationPermission,
  onLoginRequiredClose,
  onRequestUserLocation,
  onReservationCancel,
  onReservationConfirm,
  onReservationDateChange,
  onReservationTimeChange,
  reservationDate,
  reservationStore,
  reservationTime,
}: StorePanelModalsProps) => {
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

  return (
    <>
      <Modal
        isOpen={isLocationPermissionModalOpen}
        onClose={onDismissLocationPermission}
        title="내 위치를 사용할까요?"
        description="현재 위치 주변의 VITA 매장을 지도에서 바로 확인할 수 있어요."
        size="sm"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onDismissLocationPermission}
            >
              나중에
            </Button>
            <Button
              size="sm"
              onClick={onRequestUserLocation}
              disabled={isLocationRequesting}
            >
              위치 허용
            </Button>
          </>
        }
      >
        위치 정보는 근처 매장 조회와 길찾기 출발지 계산에만 사용됩니다.
      </Modal>

      <Modal
        isOpen={reservationStore !== null}
        onClose={onReservationCancel}
        title="예약 확인"
        description={
          reservationStore ? (
            <>
              <span className="text-text-primary font-bold">
                {reservationStore.name}
              </span>
              <br />
              방문 예약을 진행할까요?
            </>
          ) : undefined
        }
        size="sm"
        // 한국어가 글자 단위로 끊기지 않도록 단어 단위 줄바꿈
        className="break-keep"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={onReservationCancel}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={onReservationConfirm}
              disabled={!isReservationTimeAvailable}
              isLoading={isReservationSubmitting}
            >
              예약하기
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-text-secondary text-xs font-extrabold">
              방문 날짜
            </span>
            <input
              type="date"
              value={reservationDate}
              min={minReservationDate}
              max={maxReservationDate}
              onChange={(event) =>
                handleReservationDateChange(event.target.value)
              }
              className="border-border focus:border-brand/70 mt-2 h-10 w-full rounded-xl border bg-white px-3 text-sm font-bold text-gray-900 outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-white"
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
            운영시간 기준으로 30분 단위 시간대를 보여드려요. 최종 예약 가능
            여부는 예약 요청 시 한 번 더 확인됩니다.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isLoginRequiredModalOpen}
        onClose={onLoginRequiredClose}
        title="로그인이 필요해요"
        description="매장 방문 예약은 로그인 후 이용할 수 있어요."
        size="sm"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onLoginRequiredClose}
            >
              닫기
            </Button>
            <ButtonLink href={routes.login} size="sm">
              로그인하기
            </ButtonLink>
          </>
        }
      >
        매장 위치 확인과 길찾기는 로그인 없이 계속 이용할 수 있습니다.
      </Modal>
    </>
  );
};
