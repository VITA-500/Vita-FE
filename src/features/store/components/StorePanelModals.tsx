import { routes } from "@/shared/constants/routes";
import type { StoreLocation } from "@/features/store/types";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

type StorePanelModalsProps = {
  isLocationPermissionModalOpen: boolean;
  isLocationRequesting: boolean;
  isLoginRequiredModalOpen: boolean;
  onDismissLocationPermission: () => void;
  onLoginRequiredClose: () => void;
  onRequestUserLocation: () => void;
  onReservationCancel: () => void;
  onReservationConfirm: () => void;
  reservationStore: StoreLocation | null;
};

/** 매장 지도 패널의 모달: 위치 허용, 예약 확인, 로그인 필요 */
export const StorePanelModals = ({
  isLocationPermissionModalOpen,
  isLocationRequesting,
  isLoginRequiredModalOpen,
  onDismissLocationPermission,
  onLoginRequiredClose,
  onRequestUserLocation,
  onReservationCancel,
  onReservationConfirm,
  reservationStore,
}: StorePanelModalsProps) => (
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
          <Button size="sm" onClick={onReservationConfirm}>
            예약하기
          </Button>
        </>
      }
    >
      예약 후 매장 방문 전에
      <br />
      운영시간과 상담 가능 서비스를 한 번 더 확인해 주세요.
    </Modal>

    <Modal
      isOpen={isLoginRequiredModalOpen}
      onClose={onLoginRequiredClose}
      title="로그인이 필요해요"
      description="매장 방문 예약은 로그인 후 이용할 수 있어요."
      size="sm"
      actions={
        <>
          <Button variant="secondary" size="sm" onClick={onLoginRequiredClose}>
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
