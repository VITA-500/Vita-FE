"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toLatLng } from "@/entities/location/lib/geolocation";
import type { UserLocation } from "@/shared/lib/geo";

export type UserLocationStatus =
  "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error";

/** 사용자 현재 위치. 한 번 조회(requestLocation)와 계속 따라가기(watchLocation)를 함께 제공한다. */
export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>("idle");
  const watchIdRef = useRef<number | null>(null);

  const clearLocationWatch = useCallback(() => {
    if (
      typeof navigator !== "undefined" &&
      navigator.geolocation &&
      watchIdRef.current !== null
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }

    setStatus("requesting");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(toLatLng(position));
        setStatus("granted");
      },
      (error) => {
        setLocation(null);
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000 * 60 * 3,
        timeout: 8000,
      },
    );
  }, []);

  const watchLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return () => undefined;
    }

    clearLocationWatch();
    setStatus("requesting");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(toLatLng(position));
        setStatus("granted");
      },
      (error) => {
        setLocation(null);
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000 * 10,
        timeout: 10000,
      },
    );

    return clearLocationWatch;
  }, [clearLocationWatch]);

  useEffect(() => clearLocationWatch, [clearLocationWatch]);

  return {
    clearLocationWatch,
    location,
    requestLocation,
    status,
    watchLocation,
  };
};
