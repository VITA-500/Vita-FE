"use client";

import { useEffect, type RefObject } from "react";
import { STORE_MARKER_DATA_ATTRIBUTE } from "@/features/store/map/lib/storeMapPreviewTypes";

/** 패널 밖을 누른 뒤 이만큼(px) 넘게 움직였으면 탭이 아니라 지도 드래그로 보고 닫지 않는다. */
const OUTSIDE_TAP_MOVE_TOLERANCE_PX = 8;

type UseCloseOnOutsideTapParams = {
  isEnabled: boolean;
  onClose: () => void;
  /** 이 요소들 안을 누른 것은 "밖"이 아니다(데스크톱 사이드바·모바일 바텀 시트 등). */
  panelRefs: RefObject<HTMLElement | null>[];
};

/**
 * 매장 정보가 열려 있을 때 패널 밖을 "탭"하면 닫는다.
 * - 누르는 순간(pointerdown)이 아니라 손을 뗄 때 판단해, 지도를 끌어 둘러보는 동안에는 닫지 않는다.
 * - 패널 안, 떠 있는 모달 안, 매장 핀(다른 매장 고르기)을 누른 것은 밖이 아니다.
 *   핀을 눌렀을 때 닫으면 핀이 다시 그려져 클릭이 사라지므로, 닫지 않고 선택한 매장으로 내용만 바뀌게 둔다.
 */
export const useCloseOnOutsideTap = ({
  isEnabled,
  onClose,
  panelRefs,
}: UseCloseOnOutsideTapParams) => {
  useEffect(() => {
    if (!isEnabled) return;

    let outsidePressStart: { x: number; y: number } | null = null;
    const isOutsideTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      if (panelRefs.some((ref) => ref.current?.contains(target))) return false;
      if (target.closest(`[${STORE_MARKER_DATA_ATTRIBUTE}]`)) return false;
      // 모달(로그인 필요·예약 등)이 떠 있으면 그 안의 조작이다.
      if (document.querySelector('[aria-modal="true"]')) return false;

      return true;
    };
    const handlePointerDown = (event: PointerEvent) => {
      outsidePressStart = isOutsideTarget(event.target)
        ? { x: event.clientX, y: event.clientY }
        : null;
    };
    const handlePointerUp = (event: PointerEvent) => {
      const start = outsidePressStart;

      outsidePressStart = null;

      if (!start) return;

      const movedPx = Math.hypot(
        event.clientX - start.x,
        event.clientY - start.y,
      );

      if (movedPx <= OUTSIDE_TAP_MOVE_TOLERANCE_PX) {
        onClose();
      }
    };
    const handlePointerCancel = () => {
      outsidePressStart = null;
    };

    // 지도(카카오맵)가 이벤트 전파를 막아도 받을 수 있도록 capture 단계에서 듣는다.
    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("pointercancel", handlePointerCancel, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointerup", handlePointerUp, true);
      window.removeEventListener("pointercancel", handlePointerCancel, true);
    };
    // panelRefs는 매번 새 배열이지만 안의 ref 객체는 그대로라, 열림 여부·닫기 함수가 바뀔 때만 다시 연결한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, onClose]);
};
