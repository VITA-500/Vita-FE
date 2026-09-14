"use client";

import { useEffect, useState } from "react";
import { loadKakaoMapScript } from "@/features/store/lib/kakaoMapScript";
import { hasKakaoMapKey } from "@/shared/config/env";

export const useKakaoMapReady = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!hasKakaoMapKey) {
      return;
    }

    loadKakaoMapScript()
      .then((loaded) => {
        if (isMounted) {
          setIsReady(loaded);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsReady(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return isReady;
};
