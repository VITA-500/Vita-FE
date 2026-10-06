"use client";

import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  matchesStoreSearch,
  type UserLocation,
} from "@/features/store/lib/geo";
import {
  defaultMapLocation,
  getViewportAreaQuery,
  isStoreInVisibleArea,
  type MapSearchPoint,
  type MapViewport,
} from "@/features/store/lib/storePanelStores";
import { storeService } from "@/features/store/lib/storeService";
import type { StoreLocation } from "@/features/store/types";
import { showToast } from "@/shared/ui/ToastProvider";

type UseStoreSearchStateParams = {
  focusPoint: MapSearchPoint | null;
  searchQuery: string;
  setHasSelectedStoreInfo: Dispatch<SetStateAction<boolean>>;
  userLocation: UserLocation | null;
};

/**
 * 매장 검색 상태: 검색용 매장 풀, 지금 보이는 지도 영역·중심, 제출한(Enter·뱃지) 검색 결과.
 * 지도 영역 기준 검색(searchVisibleArea)과 검색 풀 불러오기를 함께 맡는다.
 */
export const useStoreSearchState = ({
  focusPoint,
  searchQuery,
  setHasSelectedStoreInfo,
  userLocation,
}: UseStoreSearchStateParams) => {
  const [mapCenter, setMapCenter] = useState<MapSearchPoint | null>(null);
  const [submittedSearchOrigin, setSubmittedSearchOrigin] =
    useState<MapSearchPoint | null>(null);
  const [submittedSearchStores, setSubmittedSearchStores] = useState<
    StoreLocation[] | null
  >(null);
  // 좌표가 실제로 바뀐 경우에만 상태를 갱신해 불필요한 재렌더를 막는다.
  const updateMapCenter = useCallback((point: MapSearchPoint) => {
    setMapCenter((prevPoint) =>
      prevPoint &&
      Math.abs(prevPoint.lat - point.lat) < 1e-7 &&
      Math.abs(prevPoint.lng - point.lng) < 1e-7
        ? prevPoint
        : point,
    );
  }, []);
  // 검색용 매장 풀: 검색 기준 지역(지도 중심)마다 주변 매장을 조회해 누적한다.
  const [allStores, setAllStores] = useState<StoreLocation[]>([]);
  const loadedSearchAreaKeyRef = useRef("");
  // 지금 보이는 지도 영역(지도 이동·확대/축소가 끝날 때마다 갱신)
  const [mapViewport, setMapViewport] = useState<MapViewport | null>(null);
  // 텍스트 검색 정렬 중심 좌표의 출처: 내 위치 버튼·위치 허용 → "user", 사용자가 지도를 직접 옮김 → "map"
  const [searchAnchorSource, setSearchAnchorSource] = useState<"user" | "map">(
    "user",
  );
  // 텍스트 검색 결과에서 골라 stores에 새로 추가된 매장 id (검색을 지우면 stores에서 뺀다)
  const searchAddedStoreIdsRef = useRef<Set<string>>(new Set());
  // 지도 영역 검색(searchVisibleArea) 요청 번호. 가장 최근 요청의 응답만 화면에 반영한다.
  const areaSearchRequestIdRef = useRef(0);
  // 텍스트 검색은 지금 보고 있는 지도 중심 반경 안의 매장만 대상으로 하고, 중심에서 가까운 순으로 정렬한다.
  const searchCenter =
    mapCenter ??
    focusPoint ??
    (userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : defaultMapLocation);
  const searchCenterKey = `${searchCenter.lat.toFixed(4)}:${searchCenter.lng.toFixed(4)}`;
  /** 매장이 지금 보이는 지도 영역 안에 있는지 (영역 정보가 아직 없으면 반경 기준) */
  const isInVisibleArea = (
    store: Pick<StoreLocation, "lat" | "lng">,
    viewport: MapViewport | null = mapViewport,
  ) => isStoreInVisibleArea(store, viewport, searchCenter);
  /**
   * 텍스트 검색 정렬 기준(중심 좌표).
   * 내 위치 버튼·위치 허용 후라면 내 위치, 사용자가 지도를 직접 옮겼다면 보이는 지도 중심.
   */
  const getTextSearchSortCenter = (
    viewport: MapViewport | null = mapViewport,
    anchorSource: "user" | "map" = searchAnchorSource,
  ): MapSearchPoint => {
    const viewportCenter = viewport?.center ?? searchCenter;

    return anchorSource === "user" && userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : viewportCenter;
  };
  /** 태그(뱃지) 검색 결과를 지우고 원래 매장 목록(지도에 불러와 둔 매장)으로 돌아간다. */
  const restorePreTagSearchStores = () => {
    // 아직 오지 않은 영역 검색 응답이 해제한 결과를 다시 띄우지 않도록 무효화한다.
    areaSearchRequestIdRef.current += 1;
    setSubmittedSearchStores(null);
    setHasSelectedStoreInfo(false);

    return true;
  };
  /** 지금 보이는 지도 영역을 덮는 조회 중심·반경(km). 반경은 화면 중심→모서리 거리, 최대 3km. */
  const getVisibleAreaQuery = (viewport: MapViewport | null = mapViewport) =>
    getViewportAreaQuery(viewport, searchCenter);
  /**
   * 보이는 지도 영역 기준 검색.
   * - text: 검색어에 맞는 매장을 영역 안에서 찾고, 중심 좌표(내 위치 또는 지도 중심)에서 가까운 순
   * - tag : 영역 안 매장을 모두 가져오고(뱃지 조건은 렌더 시 적용), 보이는 화면 중심에서 가까운 순
   * 결과는 검색 결과(submittedSearchStores)로만 보여주고, 원래 매장 목록(stores)은 건드리지 않는다.
   */
  const searchVisibleArea = async (
    mode: "text" | "tag",
    {
      anchorSource = searchAnchorSource,
      query = searchQuery,
      viewport = mapViewport,
    }: {
      anchorSource?: "user" | "map";
      query?: string;
      viewport?: MapViewport | null;
    } = {},
  ) => {
    const { center, radiusKm } = getVisibleAreaQuery(viewport);
    const requestId = ++areaSearchRequestIdRef.current;

    try {
      const areaStores = await storeService.fetchNearbyStores(center, radiusKm);

      // 그 사이 새 검색이 시작됐거나 결과가 해제됐으면 늦게 도착한 이 응답은 버린다.
      if (requestId !== areaSearchRequestIdRef.current) {
        return null;
      }

      // 입력 중 드롭다운 검색에도 쓰도록 검색용 매장 풀에 합쳐 둔다.
      mergeSearchStores(areaStores);

      const visibleStores = areaStores.filter((store) =>
        isInVisibleArea(store, viewport),
      );
      const results =
        mode === "text"
          ? visibleStores.filter((store) => matchesStoreSearch(store, query))
          : visibleStores;

      setSubmittedSearchOrigin(
        mode === "text"
          ? getTextSearchSortCenter(viewport, anchorSource)
          : center,
      );
      setSubmittedSearchStores(results);

      return results;
    } catch {
      if (requestId === areaSearchRequestIdRef.current) {
        showToast("매장 정보를 불러오지 못했어요.");
      }
      return null;
    }
  };
  const mergeSearchStores = (nextStores: StoreLocation[]) => {
    setAllStores((prevStores) => {
      const storeMap = new Map(prevStores.map((store) => [store.id, store]));

      nextStores.forEach((store) => {
        storeMap.set(store.id, { ...storeMap.get(store.id), ...store });
      });

      return Array.from(storeMap.values());
    });
  };
  /** 현재 검색 기준 지역(지도 중심) 주변 매장을 조회해 검색 풀에 넣는다. 이미 조회한 지역이면 건너뛴다. */
  const loadSearchAreaStores = async () => {
    if (loadedSearchAreaKeyRef.current === searchCenterKey) {
      return null;
    }

    try {
      const { center, radiusKm } = getVisibleAreaQuery();
      const areaStores = await storeService.fetchNearbyStores(center, radiusKm);

      loadedSearchAreaKeyRef.current = searchCenterKey;
      mergeSearchStores(areaStores);

      return areaStores;
    } catch {
      return null;
    }
  };

  return {
    allStores,
    areaSearchRequestIdRef,
    getTextSearchSortCenter,
    isInVisibleArea,
    loadedSearchAreaKeyRef,
    loadSearchAreaStores,
    mapViewport,
    restorePreTagSearchStores,
    searchAddedStoreIdsRef,
    searchCenter,
    searchVisibleArea,
    setAllStores,
    setMapViewport,
    setSearchAnchorSource,
    setSubmittedSearchStores,
    submittedSearchOrigin,
    submittedSearchStores,
    updateMapCenter,
  };
};
