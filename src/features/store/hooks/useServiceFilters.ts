"use client";

import { useMemo, useState } from "react";
import { buildServiceFilterColorByValue } from "@/features/store/lib/markerColors";
import type { StoreLocation } from "@/features/store/types";

const toStableServiceOptions = (services: string[], selected: string[]) =>
  Array.from(new Set([...services, ...selected]))
    .sort((first, second) => first.localeCompare(second, "ko"))
    .map((service) => ({ label: service, value: service }));

type UseServiceFiltersParams = {
  /** 검색용 매장 풀(지역별로 조회해 둔 매장) */
  allStores: StoreLocation[];
  /** 지금 지도에 불러온 매장 */
  stores: StoreLocation[];
};

/** 상담·서비스 필터 뱃지: 선택 값, 뱃지 옵션, 뱃지 색, 매장 거르기 */
export const useServiceFilters = ({
  allStores,
  stores,
}: UseServiceFiltersParams) => {
  const [consultServiceFilters, setConsultServiceFilters] = useState<string[]>(
    [],
  );
  const [providedServiceFilters, setProvidedServiceFilters] = useState<
    string[]
  >([]);
  // 필터 뱃지 옵션: 지역을 옮길 때마다 순서·구성이 바뀌어 뱃지가 자리를 옮기지 않도록
  // 지금까지 불러온 모든 매장(검색 풀 포함)과 선택 중인 값을 합쳐 가나다순으로 고정한다.
  const consultServiceFilterOptions = useMemo(
    () =>
      toStableServiceOptions(
        [...allStores, ...stores].flatMap(
          (store) => store.consultServices ?? [],
        ),
        consultServiceFilters,
      ),
    [allStores, stores, consultServiceFilters],
  );
  const providedServiceFilterOptions = useMemo(
    () =>
      toStableServiceOptions(
        [...allStores, ...stores].flatMap(
          (store) => store.providedServices ?? [],
        ),
        providedServiceFilters,
      ),
    [allStores, stores, providedServiceFilters],
  );
  const serviceFilterColorByValue = useMemo(
    () =>
      buildServiceFilterColorByValue([
        ...consultServiceFilterOptions,
        ...providedServiceFilterOptions,
      ]),
    [consultServiceFilterOptions, providedServiceFilterOptions],
  );
  /** 선택한 상담·서비스를 모두 제공하는 매장만 남긴다. */
  const filterStoresByServices = (
    storeRows: StoreLocation[],
    consultFilters: string[] = consultServiceFilters,
    providedFilters: string[] = providedServiceFilters,
  ) =>
    storeRows.filter((store) => {
      const consultServices = store.consultServices ?? [];
      const providedServices = store.providedServices ?? [];
      const matchesConsultService = consultFilters.every((service) =>
        consultServices.includes(service),
      );
      const matchesProvidedService = providedFilters.every((service) =>
        providedServices.includes(service),
      );

      return matchesConsultService && matchesProvidedService;
    });
  const hasActiveServiceFilter =
    consultServiceFilters.length > 0 || providedServiceFilters.length > 0;

  return {
    consultServiceFilterOptions,
    consultServiceFilters,
    filterStoresByServices,
    hasActiveServiceFilter,
    providedServiceFilterOptions,
    providedServiceFilters,
    serviceFilterColorByValue,
    setConsultServiceFilters,
    setProvidedServiceFilters,
  };
};
