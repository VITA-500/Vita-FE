"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserLocation } from "@/features/store/hooks/useUserLocation";
import { formatDistance, getDistanceMeters } from "@/features/store/lib/geo";
import type { StoreLocation } from "@/features/store/types";

export const useStoreMapState = (stores: StoreLocation[]) => {
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("전체");
  const {
    location: userLocation,
    requestLocation,
    status: locationStatus,
    watchLocation,
  } = useUserLocation();

  useEffect(() => {
    if (stores.length === 0) {
      const frameId = window.requestAnimationFrame(() => {
        setSelectedStoreId("");
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    if (!stores.some((store) => store.id === selectedStoreId)) {
      const frameId = window.requestAnimationFrame(() => {
        setSelectedStoreId(stores[0].id);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }
  }, [selectedStoreId, stores]);

  const sortedStores = useMemo(() => {
    return userLocation
      ? stores
          .map((store) => {
            const distanceMeters = getDistanceMeters(userLocation, store);

            return {
              ...store,
              distanceText: formatDistance(distanceMeters),
              distanceMeters,
            };
          })
          .sort((firstStore, secondStore) => {
            return firstStore.distanceMeters - secondStore.distanceMeters;
          })
      : stores;
  }, [stores, userLocation]);

  // 검색어는 지도 핀을 바로 거르지 않는다. 검색 결과는 드롭다운에서 고를 때만 지도에 반영된다.
  const displayStores = useMemo(() => {
    return sortedStores.filter(
      (store) =>
        activeFilter === "전체" || store.address.includes(activeFilter),
    );
  }, [activeFilter, sortedStores]);

  const selectedStore = useMemo(() => {
    return (
      displayStores.find((store) => store.id === selectedStoreId) ??
      displayStores[0] ??
      stores.find((store) => store.id === selectedStoreId) ??
      stores[0]
    );
  }, [displayStores, selectedStoreId, stores]);

  return {
    activeFilter,
    displayStores,
    locationStatus,
    requestLocation,
    searchQuery,
    selectedStore,
    selectedStoreId,
    setActiveFilter,
    setSearchQuery,
    setSelectedStoreId,
    sortedStores,
    userLocation,
    visibleSelectedStoreId: selectedStore?.id ?? selectedStoreId,
    watchLocation,
  };
};
