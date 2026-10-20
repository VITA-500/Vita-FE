"use client";

import { useEffect, useMemo, useState } from "react";
import type { UserLocation } from "@/shared/lib/geo";
import { useBenefitServiceFilters } from "@/features/store/benefit/hooks/useBenefitServiceFilters";
import {
  defaultMapLocation,
  type MapSearchPoint,
} from "@/features/store/search/lib/storePanelStores";
import type { MapCategory } from "@/features/store/types";
import type { StoreLocation, StoreOpenFilter } from "@/entities/store";
import { useBenefitCategoriesQuery } from "@/entities/benefit";
import { useBenefitStoresQuery } from "@/entities/store";
import { showToast } from "@/shared/providers/ToastProvider";

type UseBenefitStoresParams = {
  activeMapCategory: MapCategory;
  /** 로그인 후 돌아와 되살릴 혜택 카테고리(storeMapSnapshot) */
  initialSelectedBenefitCategory?: string;
  openFilter: StoreOpenFilter;
  userLocation: UserLocation | null;
};

/**
 * 제휴 혜택 탭에서 카테고리별 제휴 매장을 가까운 순으로 불러온다. 상단 혜택 뱃지 필터는 useBenefitServiceFilters가 맡는다.
 * 카테고리 목록과 제휴 매장 조회·캐시는 TanStack Query가 맡는다.
 */
export const useBenefitStores = ({
  activeMapCategory,
  initialSelectedBenefitCategory,
  openFilter,
  userLocation,
}: UseBenefitStoresParams) => {
  const categoriesQuery = useBenefitCategoriesQuery();
  const benefitCategories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const [chosenBenefitCategory, setSelectedBenefitCategory] = useState(
    initialSelectedBenefitCategory ?? "",
  );
  // 고른 카테고리가 없으면 첫 카테고리를 기본으로 쓴다.
  const selectedBenefitCategory =
    chosenBenefitCategory || benefitCategories[0]?.value || "";
  const lookupLocation = userLocation ?? defaultMapLocation;
  const lookupLat = Number(lookupLocation.lat.toFixed(3));
  const lookupLng = Number(lookupLocation.lng.toFixed(3));
  // 소수 셋째 자리(약 100m)로 맞춰 위치가 조금 흔들려도 같은 조회로 본다.
  const benefitLookupLocation = useMemo(
    () => ({ lat: lookupLat, lng: lookupLng }),
    [lookupLat, lookupLng],
  );
  const benefitStoresQuery = useBenefitStoresQuery({
    category: selectedBenefitCategory,
    enabled: activeMapCategory === "benefit",
    location: benefitLookupLocation,
    openFilter,
  });
  const benefitStores: StoreLocation[] = useMemo(
    () => benefitStoresQuery.data ?? [],
    [benefitStoresQuery.data],
  );
  const isBenefitStoreLoading = benefitStoresQuery.isFetching;

  useEffect(() => {
    if (categoriesQuery.isError) {
      showToast("제휴 혜택 카테고리를 불러오지 못했어요.");
    }
  }, [categoriesQuery.isError]);

  useEffect(() => {
    if (benefitStoresQuery.isError) {
      showToast("제휴 매장 정보를 불러오지 못했어요.");
    }
  }, [benefitStoresQuery.isError, benefitStoresQuery.errorUpdatedAt]);

  const benefitStoresOrigin: MapSearchPoint = benefitLookupLocation;
  const serviceFilters = useBenefitServiceFilters(benefitStores);
  /** 목록의 카테고리를 바꾸면 이전 카테고리의 혜택 뱃지 선택은 의미가 없으므로 기본 선택(모두 활성)으로 되돌린다. */
  const changeBenefitCategory = (category: string) => {
    setSelectedBenefitCategory(category);

    if (category !== selectedBenefitCategory) {
      serviceFilters.resetBenefitServiceFilters();
    }
  };

  return {
    ...serviceFilters,
    benefitCategories,
    benefitStores,
    benefitStoresOrigin,
    changeBenefitCategory,
    isBenefitStoreLoading,
    selectedBenefitCategory,
    setSelectedBenefitCategory,
  };
};
