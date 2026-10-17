"use client";

import { useCallback, useRef } from "react";

export type StoreMapCameraOwner = "user" | "auto";

/** 응답 시점과 무관하게 마지막 사용자 의도를 자동 맞춤 직전까지 유지한다. */
export const useStoreMapCameraOwner = (isRestored: boolean) => {
  const cameraOwnerRef = useRef<StoreMapCameraOwner>(
    isRestored ? "user" : "auto",
  );
  const setCameraOwner = useCallback((owner: StoreMapCameraOwner) => {
    cameraOwnerRef.current = owner;
  }, []);

  return { cameraOwnerRef, setCameraOwner };
};
