"use client";

import { useSyncExternalStore } from "react";
import { DESKTOP_MIN_WIDTH_PX } from "@/features/store/lib/desktopBreakpoint";

/** 데스크톱 레이아웃 기준(DESKTOP_MIN_WIDTH_PX) 미디어 쿼리 */
const DESKTOP_QUERY = `(min-width: ${DESKTOP_MIN_WIDTH_PX}px)`;

const subscribe = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(DESKTOP_QUERY);

  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
};

/** 지금 화면이 데스크톱 너비(DESKTOP_MIN_WIDTH_PX 이상)인지. 서버 렌더링에서는 데스크톱으로 본다. */
export const useIsDesktopViewport = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
