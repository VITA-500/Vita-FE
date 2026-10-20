"use client";

import {
  keepPreviousData,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { mergeStoreDetail, storeApi } from "@/entities/store/api/storeApi";
import { getOpenFilterKey } from "@/entities/store/model/storeOpenHours";
import type {
  StoreLocation,
  StoreOpenFilter,
} from "@/entities/store/model/types";
import type { LatLng } from "@/shared/lib/geo";

export const storeQueryKeys = {
  all: ["store"] as const,
  detail: (storeId: string) =>
    [...storeQueryKeys.all, "detail", storeId] as const,
  nearby: (
    location: LatLng,
    radiusKm: number | undefined,
    openFilter: StoreOpenFilter | undefined,
  ) =>
    [
      ...storeQueryKeys.all,
      "nearby",
      {
        lat: location.lat,
        lng: location.lng,
        openFilter: openFilter ? getOpenFilterKey(openFilter) : "all",
        radiusKm: radiusKm ?? null,
      },
    ] as const,
  benefitStores: (
    category: string,
    location: LatLng,
    openFilter: StoreOpenFilter,
  ) =>
    [
      ...storeQueryKeys.all,
      "benefitStores",
      {
        category,
        lat: location.lat,
        lng: location.lng,
        openFilter: getOpenFilterKey(openFilter),
      },
    ] as const,
};

/**
 * 혜택 카테고리별 주변 제휴 매장. 조건이 바뀌는 동안에는 직전 결과를 그대로 보여준다(목록이 비었다 채워지며 깜빡이지 않도록).
 * enabled가 false(제휴 혜택 탭이 아님)여도 마지막 결과는 캐시에 남아 탭으로 돌아오면 바로 보인다.
 */
export const useBenefitStoresQuery = ({
  category,
  enabled,
  location,
  openFilter,
}: {
  category: string;
  enabled: boolean;
  location: LatLng;
  openFilter: StoreOpenFilter;
}) =>
  useQuery({
    enabled: enabled && Boolean(category),
    placeholderData: keepPreviousData,
    queryFn: () =>
      storeApi.fetchBenefitStores(category, location, undefined, undefined, {
        openFilter,
      }),
    queryKey: storeQueryKeys.benefitStores(category, location, openFilter),
    retry: false,
    staleTime: 60_000,
  });

type NearbyStoresQuery = {
  /** 반경(km). 없으면 BE 기본(1.5km) */
  radiusKm?: number;
  openFilter?: StoreOpenFilter;
};

/** 주변 매장 조회 옵션. 같은 지점·반경·영업 시간 조건은 잠깐(30초) 캐시해 연달아 같은 조회를 보내지 않는다. */
export const nearbyStoresQueryOptions = (
  location: LatLng,
  { openFilter, radiusKm }: NearbyStoresQuery = {},
) =>
  queryOptions({
    queryFn: () =>
      storeApi.fetchNearbyStores(location, radiusKm, { openFilter }),
    queryKey: storeQueryKeys.nearby(location, radiusKm, openFilter),
    retry: false,
    staleTime: 30_000,
  });

/**
 * 주변 매장을 한 번 조회하는 함수(Promise). 매장 지도는 지역 선택·따라가기·결과 없음 복귀처럼
 * 조회 시점을 직접 정해야 해서 useQuery 대신 queryClient.fetchQuery로 캐시와 중복 제거만 쓴다.
 */
export const useFetchNearbyStores = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (location: LatLng, query?: NearbyStoresQuery) =>
      queryClient.fetchQuery(nearbyStoresQueryOptions(location, query)),
    [queryClient],
  );
};

/** 매장 상세 응답(목록 값과 합치기 전). 영업시간·연락처는 자주 바뀌지 않아 5분 캐시한다. */
export const storeDetailQueryOptions = (storeId: string) =>
  queryOptions({
    queryFn: () => storeApi.fetchStoreDetailResponse(storeId),
    queryKey: storeQueryKeys.detail(storeId),
    retry: false,
    staleTime: 5 * 60_000,
  });

/**
 * 매장 상세를 한 번 조회하는 함수(Promise). 상세 응답은 캐시하고, 목록에서 받은 값(fallback)은 매번 합친다.
 * API 매장이 아니면(목업 등) 목록 값을 그대로 돌려준다.
 */
export const useFetchStoreDetail = () => {
  const queryClient = useQueryClient();

  return useCallback(
    async (storeId: string, fallback?: StoreLocation) => {
      const response = await queryClient.fetchQuery(
        storeDetailQueryOptions(storeId),
      );

      return response
        ? mergeStoreDetail(response, fallback)
        : (fallback ?? null);
    },
    [queryClient],
  );
};
