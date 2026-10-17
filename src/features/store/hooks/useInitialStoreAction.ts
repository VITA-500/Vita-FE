"use client";

import type { Dispatch, SetStateAction } from "react";
import { findStoreById } from "@/features/store/lib/storePanelStores";
import { storeService } from "@/features/store/lib/storeService";
import type {
  MapCategory,
  StoreLocation,
  StoreMapInitialAction,
  StoreRouteMode,
} from "@/features/store/types";
import { showToast } from "@/shared/ui/ToastProvider";

type UseInitialStoreActionParams = {
  categoryDisplayStores: StoreLocation[];
  categoryStores: StoreLocation[];
  changeRouteMode: (mode: StoreRouteMode) => void;
  handleRouteStart: (store: StoreLocation) => void;
  searchableStores: StoreLocation[];
  setActiveMapCategory: Dispatch<SetStateAction<MapCategory>>;
  setRouteReturnServices: Dispatch<SetStateAction<string[]>>;
  setSelectedBenefitCategory: Dispatch<SetStateAction<string>>;
  showStoreOnMap: (
    storeId: string,
    storeDetail: StoreLocation,
    category?: MapCategory,
  ) => void;
  stores: StoreLocation[];
};

export const useInitialStoreAction = ({
  categoryDisplayStores,
  categoryStores,
  changeRouteMode,
  handleRouteStart,
  searchableStores,
  setActiveMapCategory,
  setRouteReturnServices,
  setSelectedBenefitCategory,
  showStoreOnMap,
  stores,
}: UseInitialStoreActionParams) => {
  const handleInitialStoreAction = async (action: StoreMapInitialAction) => {
    if (action.category) {
      setActiveMapCategory(action.category);
    }
    if (action.benefitCategory) {
      setSelectedBenefitCategory(action.benefitCategory);
    }

    setRouteReturnServices(action.activeServices ?? []);

    const fallback = findStoreById(
      action.storeId,
      categoryDisplayStores,
      categoryStores,
      searchableStores,
      stores,
    );
    const storeDetail = await storeService
      .fetchStoreDetail(action.storeId, fallback)
      .catch(() => null);
    const store = storeDetail ?? fallback;

    if (!store) {
      showToast("매장 정보를 불러오지 못했어요.");
      return;
    }

    const storeWithActionContext =
      action.category === "benefit"
        ? {
            ...store,
            benefitCategory: store.benefitCategory ?? action.benefitCategory,
            storeType: "PARTNER" as const,
          }
        : store;

    showStoreOnMap(action.storeId, storeWithActionContext, action.category);

    if (action.action === "route") {
      if (action.routeMode) {
        changeRouteMode(action.routeMode);
      }

      handleRouteStart(storeWithActionContext);
    }
  };

  return { handleInitialStoreAction };
};
