import type { Dispatch, RefObject, SetStateAction } from "react";
import type { useNearbyStores } from "@/features/store/hooks/useNearbyStores";
import type { useServiceFilters } from "@/features/store/hooks/useServiceFilters";
import type { useStoreMapState } from "@/features/store/hooks/useStoreMapState";
import type { useStorePanelLayout } from "@/features/store/hooks/useStorePanelLayout";
import type { useStoreRoute } from "@/features/store/hooks/useStoreRoute";
import type { useStoreSearchHistory } from "@/features/store/hooks/useStoreSearchHistory";
import type { useStoreSearchResults } from "@/features/store/hooks/useStoreSearchResults";
import type { useStoreSearchState } from "@/features/store/hooks/useStoreSearchState";
import type { useStoreSelectionActions } from "@/features/store/hooks/useStoreSelectionActions";
import type { MapSearchPoint } from "@/features/store/lib/storePanelStores";
import type { StoreLocation } from "@/features/store/types";

/** 검색 동작 hook(필터·텍스트)이 함께 받는 값. 지도 패널의 상태·다른 hook 결과를 그대로 넘긴다. */
export type StoreSearchActionsParams = Pick<
  ReturnType<typeof useStoreMapState>,
  "searchQuery" | "setSearchQuery"
> &
  Pick<
    ReturnType<typeof useServiceFilters>,
    | "consultServiceFilterOptions"
    | "consultServiceFilters"
    | "filterStoresByServices"
    | "hasActiveServiceFilter"
    | "providedServiceFilterOptions"
    | "providedServiceFilters"
    | "setConsultServiceFilters"
    | "setProvidedServiceFilters"
  > &
  Pick<
    ReturnType<typeof useStoreSearchState>,
    | "areaSearchRequestIdRef"
    | "loadedSearchAreaKeyRef"
    | "loadSearchAreaStores"
    | "mapViewport"
    | "restorePreTagSearchStores"
    | "searchAddedStoreIdsRef"
    | "searchCenter"
    | "searchVisibleArea"
    | "setAllStores"
    | "setMapViewport"
    | "setSubmittedSearchStores"
    | "submittedSearchStores"
    | "updateMapCenter"
  > &
  Pick<
    ReturnType<typeof useStoreSearchResults>,
    "isTagSearchQuery" | "searchedServices"
  > &
  Pick<
    ReturnType<typeof useNearbyStores>,
    "lastNearbyLookupKeyRef" | "nearbyLookup" | "updateStoresByLocation"
  > &
  Pick<ReturnType<typeof useStoreSelectionActions>, "handleStoreSelect"> &
  Pick<
    ReturnType<typeof useStoreRoute>,
    "resetRouteState" | "routeDestinationStoreId"
  > &
  Pick<
    ReturnType<typeof useStorePanelLayout>,
    "setIsSearchHistoryOpen" | "setIsStoreListCollapsed"
  > &
  Pick<ReturnType<typeof useStoreSearchHistory>, "addHistory"> & {
    /** 지금 정보 카드가 떠 있는(또는 길찾기 도착) 매장 */
    mapSelectedStore?: StoreLocation;
    searchInputRef: RefObject<HTMLInputElement | null>;
    searchPoint: MapSearchPoint | null;
    setHasSelectedStoreInfo: Dispatch<SetStateAction<boolean>>;
    setSearchPoint: Dispatch<SetStateAction<MapSearchPoint | null>>;
    setSoloStoreId: Dispatch<SetStateAction<string>>;
    setStores: Dispatch<SetStateAction<StoreLocation[]>>;
  };
