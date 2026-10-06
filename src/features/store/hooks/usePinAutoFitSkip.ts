"use client";

import { useEffect, useRef } from "react";

/** 마지막 필터 해제 후 매장을 다시 불러오는 동안 지도를 자동으로 옮기지 않는 시간(ms) */
const PIN_AUTO_FIT_SKIP_MS = 2500;

/**
 * 잠시 동안 핀 자동 맞춤(지도 이동)을 멈추는 스위치.
 * isPinAutoFitSkippedRef가 true인 동안 지도는 새 핀 묶음에 맞춰 움직이지 않는다.
 */
export const usePinAutoFitSkip = () => {
  const isPinAutoFitSkippedRef = useRef(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const skipPinAutoFitForAWhile = () => {
    isPinAutoFitSkippedRef.current = true;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      isPinAutoFitSkippedRef.current = false;
    }, PIN_AUTO_FIT_SKIP_MS);
  };

  return { isPinAutoFitSkippedRef, skipPinAutoFitForAWhile };
};
