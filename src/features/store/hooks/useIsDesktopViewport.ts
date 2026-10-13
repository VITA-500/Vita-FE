"use client";

import { useSyncExternalStore } from "react";

/** 데스크톱 레이아웃 기준(Tailwind md). 지도 패널은 이 너비부터 좌측 사이드바, 그 아래는 바텀 시트로 보여준다. */
const DESKTOP_QUERY = "(min-width: 768px)";

const subscribe = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(DESKTOP_QUERY);

  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
};

/** 지금 화면이 데스크톱 너비(768px 이상)인지. 서버 렌더링에서는 데스크톱으로 본다. */
export const useIsDesktopViewport = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
