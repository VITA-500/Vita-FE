"use client";

import { useEffect, useState } from "react";
import {
  readStoreMapSnapshot,
  type StoreMapSnapshot,
} from "@/features/store/panel/lib/storeMapSnapshot";

/**
 * 로그인하러 가기 전에 보관해 둔 지도 화면을 읽는다.
 * 서버에서 그린 HTML과 첫 화면이 달라지지 않도록(hydration) 화면을 띄운 뒤에 읽어 돌려준다.
 * 화면이 가려진 탭에서도 바로 읽도록 animation frame 대신 timeout을 쓴다.
 */
export const useSavedStoreMapSnapshot = (isEnabled: boolean) => {
  const [snapshot, setSnapshot] = useState<StoreMapSnapshot | null>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const savedSnapshot = readStoreMapSnapshot();

    if (!savedSnapshot) return;

    const timeoutId = window.setTimeout(() => {
      setSnapshot(savedSnapshot);
    });

    return () => window.clearTimeout(timeoutId);
  }, [isEnabled]);

  return snapshot;
};
