"use client";

import type { Dispatch, SetStateAction } from "react";
import type { UserLocation } from "@/shared/lib/geo";
import {
  defaultMapLocation,
  type MapSearchPoint,
} from "@/features/store/lib/storePanelStores";
import type { MapCategory } from "@/features/store/types";
import type { StoreLocation } from "@/entities/store";

type UseStoreRouteReturnActionsParams = {
  activeMapCategory: MapCategory;
  resetRouteState: () => void;
  routeDestinationStore?: StoreLocation;
  setActiveMapCategory: Dispatch<SetStateAction<MapCategory>>;
  setFocusPoint: Dispatch<SetStateAction<MapSearchPoint | null>>;
  setHasSelectedStoreInfo: Dispatch<SetStateAction<boolean>>;
  setIsSearchHistoryOpen: Dispatch<SetStateAction<boolean>>;
  setIsWaitingForPinSelection: Dispatch<SetStateAction<boolean>>;
  setSearchPoint: Dispatch<SetStateAction<MapSearchPoint | null>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedBenefitCategory: Dispatch<SetStateAction<string>>;
  setSelectedStoreId: Dispatch<SetStateAction<string>>;
  setSoloStoreId: Dispatch<SetStateAction<string>>;
  updateStoresByLocation: (
    point: MapSearchPoint,
    options?: { showLoadingCard?: boolean },
  ) => void;
  userLocation: UserLocation | null;
};

export const useStoreRouteReturnActions = ({
  activeMapCategory,
  resetRouteState,
  routeDestinationStore,
  setActiveMapCategory,
  setFocusPoint,
  setHasSelectedStoreInfo,
  setIsSearchHistoryOpen,
  setIsWaitingForPinSelection,
  setSearchPoint,
  setSearchQuery,
  setSelectedBenefitCategory,
  setSelectedStoreId,
  setSoloStoreId,
  updateStoresByLocation,
  userLocation,
}: UseStoreRouteReturnActionsParams) => {
  const clearSelectedStore = () => {
    setIsSearchHistoryOpen(false);
    setHasSelectedStoreInfo(false);
    setSoloStoreId("");
    setSelectedStoreId("");
  };

  const showNearbyStoresAfterRoute = () => {
    const currentPoint =
      routeDestinationStore ?? userLocation ?? defaultMapLocation;
    const isBenefitRoute =
      activeMapCategory === "benefit" ||
      routeDestinationStore?.storeType === "PARTNER" ||
      Boolean(routeDestinationStore?.benefitCategory);

    resetRouteState();

    if (isBenefitRoute) {
      setActiveMapCategory("benefit");
      if (routeDestinationStore?.benefitCategory) {
        setSelectedBenefitCategory(routeDestinationStore.benefitCategory);
      }
      clearSelectedStore();
      setFocusPoint(currentPoint);
      return;
    }

    setActiveMapCategory("store");
    setSearchQuery("");
    clearSelectedStore();
    setIsWaitingForPinSelection(true);
    setFocusPoint(currentPoint);
    setSearchPoint(currentPoint);
    updateStoresByLocation(currentPoint, { showLoadingCard: true });
  };

  return { showNearbyStoresAfterRoute };
};
