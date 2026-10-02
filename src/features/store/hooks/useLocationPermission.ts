"use client";

import { useEffect, useState, type RefObject } from "react";
import type { UserLocation } from "@/features/store/lib/geo";
import {
  getGeolocationPermissionState,
  LOCATION_CONSENT_STORAGE_KEY,
  LOCATION_MODAL_DISMISSED_STORAGE_KEY,
  readStorage,
  writeStorage,
} from "@/features/store/lib/storePanelStorage";
import type { UserLocationStatus } from "@/features/store/hooks/useUserLocation";
import { showToast } from "@/shared/ui/ToastProvider";

type UseLocationPermissionParams = {
  /** 길찾기 중인지(도착 매장이 정해져 있는지) */
  isRouteActive: boolean;
  locationStatus: UserLocationStatus;
  /** 위치 허용 모달에서 "위치 허용"을 눌렀을 때: 내 위치로 이동·주변 매장 조회 */
  onConsent: () => void;
  /** 위치 없이 길찾기를 계속할 수 없을 때 길찾기를 취소한다. */
  onRouteCancel: () => void;
  requestLocation: () => void;
  /** 위치를 받으면 내 위치로 지도를 옮기고 주변 매장을 불러올지(진입 시 권한이 이미 있는 경우 켠다) */
  shouldFocusUserLocationRef: RefObject<boolean>;
  userLocation: UserLocation | null;
};

/** 위치 권한: 진입 시 권한 확인, 위치 허용 모달 열기/허용/나중에, 차단 안내 */
export const useLocationPermission = ({
  isRouteActive,
  locationStatus,
  onConsent,
  onRouteCancel,
  requestLocation,
  shouldFocusUserLocationRef,
  userLocation,
}: UseLocationPermissionParams) => {
  // 위치 허용 모달은 진입할 때마다 무조건 띄우지 않고, 권한 상태를 확인한 뒤 필요할 때만 연다.
  const [isLocationPermissionModalOpen, setIsLocationPermissionModalOpen] =
    useState(false);

  const requestUserLocationFromModal = () => {
    setIsLocationPermissionModalOpen(false);
    writeStorage("local", LOCATION_CONSENT_STORAGE_KEY, "granted");
    onConsent();
  };
  /**
   * 위치 허용 모달 "나중에"/닫기:
   * - 이번 세션 동안은 모달을 다시 띄우지 않는다.
   * - 위치 없이 기본 위치 주변 매장을 보여주고(진입 시 이미 조회됨), 나중에 켜는 방법을 안내한다.
   * - 이후 "내 위치" 버튼이나 길찾기에서 위치가 필요하면 그때 다시 묻는다.
   */
  const dismissLocationPermissionModal = () => {
    setIsLocationPermissionModalOpen(false);
    writeStorage("session", LOCATION_MODAL_DISMISSED_STORAGE_KEY, "true");

    if (userLocation) {
      return;
    }

    // 길찾기 시작 중에 "나중에"를 누르면 위치 없이 경로를 계산할 수 없으므로 길찾기를 취소한다.
    // (취소하지 않으면 "이동 경로 탐색 중" 오버레이가 계속 떠 있게 된다.)
    if (isRouteActive) {
      onRouteCancel();
      showToast("위치를 허용해야 경로를 볼 수 있어요.");
      return;
    }

    showToast(
      "기본 위치 주변 매장을 보여드릴게요. 내 위치 버튼으로 언제든 위치를 켤 수 있어요.",
    );
  };

  // 진입 시 위치 권한 확인:
  // - 이미 허용됨(또는 이전에 모달에서 허용) → 모달 없이 바로 내 위치 조회
  // - 차단됨 / 이번 세션에 "나중에" 선택 → 모달 띄우지 않음
  // - 아직 묻지 않음 → 모달 표시
  useEffect(() => {
    let isCancelled = false;

    void getGeolocationPermissionState().then((permissionState) => {
      if (isCancelled) {
        return;
      }

      const hasConsented =
        readStorage("local", LOCATION_CONSENT_STORAGE_KEY) === "granted";

      if (
        permissionState === "granted" ||
        (permissionState === null && hasConsented)
      ) {
        shouldFocusUserLocationRef.current = true;
        requestLocation();
        return;
      }

      if (
        permissionState === "denied" ||
        readStorage("session", LOCATION_MODAL_DISMISSED_STORAGE_KEY) === "true"
      ) {
        return;
      }

      setIsLocationPermissionModalOpen(true);
    });

    return () => {
      isCancelled = true;
    };
    // shouldFocusUserLocationRef는 ref라 의존성에 넣지 않는다(기존과 같이 requestLocation이 바뀔 때만 다시 확인).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestLocation]);

  // 위치 요청이 차단되면 이유를 알려준다.
  useEffect(() => {
    if (locationStatus === "denied") {
      showToast("브라우저 설정에서 위치 권한을 허용해 주세요.");
    }
  }, [locationStatus]);

  return {
    dismissLocationPermissionModal,
    isLocationPermissionModalOpen,
    openLocationPermissionModal: () => setIsLocationPermissionModalOpen(true),
    requestUserLocationFromModal,
  };
};
