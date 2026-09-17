"use client";

import { useCallback, useState } from "react";
import type { UserLocation } from "@/features/store/lib/geo";

export type UserLocationStatus =
  "idle" | "requesting" | "granted" | "denied" | "unsupported" | "error";

export const useUserLocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>("idle");

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

  return {
    location,
    requestLocation,
    status,
  };
};
