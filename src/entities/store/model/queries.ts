"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { storeApi } from "@/entities/store/api/storeApi";
import { getOpenFilterKey } from "@/entities/store/model/storeOpenHours";
import type { StoreOpenFilter } from "@/entities/store/model/types";
import type { LatLng } from "@/shared/lib/geo";

export const storeQueryKeys = {
  all: ["store"] as const,
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
