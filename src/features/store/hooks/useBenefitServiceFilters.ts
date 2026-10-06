"use client";

import { useMemo, useState } from "react";
import {
  buildServiceFilterColorByValue,
  getServiceFilterColor,
  type MarkerColorInfo,
} from "@/features/store/lib/markerColors";
import type { StoreLocation } from "@/features/store/types";

/** 혜택 뱃지가 이 개수 이상이면 처음 조회했을 때 모두 선택(활성) 상태로 보여준다. */
const DEFAULT_ALL_SELECTED_MIN_COUNT = 2;

/** 제휴 혜택 필터 뱃지 값: 혜택 이름(없으면 제휴 브랜드). 목록에 보이는 텍스트와 같다. */
export const getBenefitFilterValue = (store: StoreLocation) =>
  store.benefitName || store.benefitBrand || "";

/**
 * 제휴 혜택 탭 상단 뱃지 필터: 선택 값, 뱃지 옵션·색, 제휴 매장 거르기, 핀 색.
 * 매장 탭의 useServiceFilters(상담·서비스 AND 매칭)와 로직이 달라 따로 둔다.
 */
export const useBenefitServiceFilters = (benefitStores: StoreLocation[]) => {
  // null: 사용자가 아직 뱃지를 건드리지 않음(기본 선택 규칙을 따른다). 배열: 사용자가 고른 값.
  const [pickedFilters, setPickedFilters] = useState<string[] | null>(null);
  // 뱃지 옵션: 지금 불러온 제휴 매장의 혜택/서비스 + 선택 중인 값(재조회로 사라져도 뱃지가 남도록), 가나다순.
  const benefitServiceFilterOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...benefitStores.map(getBenefitFilterValue).filter(Boolean),
          ...(pickedFilters ?? []),
        ]),
      )
        .sort((first, second) => first.localeCompare(second, "ko"))
        .map((value) => ({ label: value, value })),
    [benefitStores, pickedFilters],
  );
  // 조회한 혜택이 두 개 이상이면 처음에는 모두 활성 상태로 보여주고, 사용자가 끄면서 좁혀 가게 한다.
  const benefitServiceFilters = useMemo(
    () =>
      pickedFilters ??
      (benefitServiceFilterOptions.length >= DEFAULT_ALL_SELECTED_MIN_COUNT
        ? benefitServiceFilterOptions.map((option) => option.value)
        : []),
    [benefitServiceFilterOptions, pickedFilters],
  );
  const benefitServiceFilterColorByValue = useMemo(
    () => buildServiceFilterColorByValue(benefitServiceFilterOptions),
    [benefitServiceFilterOptions],
  );
  /**
   * 제휴 매장은 혜택 하나에 묶인 행이라 매장 탭처럼 "모두 제공(AND)"이 아니라
   * 고른 혜택 중 하나라도 해당하면(OR) 남긴다. 선택이 없으면 전체를 보여준다.
   */
  const filteredBenefitStores = useMemo(
    () =>
      benefitServiceFilters.length === 0
        ? benefitStores
        : benefitStores.filter((store) =>
            benefitServiceFilters.includes(getBenefitFilterValue(store)),
          ),
    [benefitServiceFilters, benefitStores],
  );
  const benefitMarkerColorInfoById = useMemo<
    Record<string, MarkerColorInfo>
  >(() => {
    if (benefitServiceFilters.length === 0) {
      return {};
    }

    return Object.fromEntries(
      filteredBenefitStores.map((store) => [
        store.id,
        {
          colors: [
            benefitServiceFilterColorByValue[getBenefitFilterValue(store)] ??
              getServiceFilterColor(0),
          ],
          extraServices: [],
        },
      ]),
    );
  }, [
    benefitServiceFilterColorByValue,
    benefitServiceFilters,
    filteredBenefitStores,
  ]);

  return {
    benefitMarkerColorInfoById,
    benefitServiceFilterOptions,
    benefitServiceFilters,
    /** 모두 해제: 선택 없음 = 전체 제휴 매장 */
    clearBenefitServiceFilters: () => setPickedFilters([]),
    filteredBenefitStores,
    hasActiveBenefitServiceFilter: benefitServiceFilters.length > 0,
    /** 카테고리를 바꿀 때 호출: 다시 기본 선택 규칙(모두 활성)으로 돌아간다. */
    resetBenefitServiceFilters: () => setPickedFilters(null),
    setBenefitServiceFilters: (nextValue: string[]) =>
      setPickedFilters(nextValue),
  };
};
