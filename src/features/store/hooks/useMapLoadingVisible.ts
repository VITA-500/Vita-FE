"use client";

import { useEffect, useState } from "react";
import { hasKakaoMapKey } from "@/shared/config/env";

/** 카카오맵 SDK가 이 시간 안에 준비되지 않으면 로딩 화면을 걷고 대체 지도를 보여준다(ms) */
const MAP_SDK_LOAD_TIMEOUT_MS = 10000;

type UseMapLoadingVisibleParams = {
  isKakaoMapReady: boolean;
  /** 지도가 처음 화면에 그려졌는지(첫 타일 로딩 완료) */
  isMapFirstPainted: boolean;
};

/** 지도 로딩 화면을 보여줄지. 첫 타일이 그려지거나, SDK를 끝내 불러오지 못하면 걷는다. */
export const useMapLoadingVisible = ({
  isKakaoMapReady,
  isMapFirstPainted,
}: UseMapLoadingVisibleParams) => {
  const [isMapSdkLoadTimedOut, setIsMapSdkLoadTimedOut] = useState(false);

  useEffect(() => {
    if (!hasKakaoMapKey) return;

    const timeoutId = window.setTimeout(
      () => setIsMapSdkLoadTimedOut(true),
      MAP_SDK_LOAD_TIMEOUT_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, []);

  // SDK를 끝내 불러오지 못하면 로딩 화면을 걷고 대체 지도(가짜 핀)를 보여준다.
  return (
    hasKakaoMapKey &&
    !isMapFirstPainted &&
    !(isMapSdkLoadTimedOut && !isKakaoMapReady)
  );
};
