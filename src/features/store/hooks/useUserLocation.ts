"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UserLocation } from "@/features/store/lib/geo";

export type UserLocationStatus =
  "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error";

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
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
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
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
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
