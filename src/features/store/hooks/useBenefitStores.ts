"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UserLocation } from "@/features/store/lib/geo";
import { useBenefitServiceFilters } from "@/features/store/hooks/useBenefitServiceFilters";
import {
  defaultMapLocation,
  type MapSearchPoint,
} from "@/features/store/lib/storePanelStores";
import {
  benefitService,
  type BenefitCategoryOption,
} from "@/features/store/lib/benefitService";
import type { MapCategory, StoreLocation } from "@/features/store/types";
import { showToast } from "@/shared/ui/ToastProvider";

type UseBenefitStoresParams = {
  activeMapCategory: MapCategory;
  userLocation: UserLocation | null;
};

/** 제휴 혜택 탭에서 카테고리별 제휴 매장을 가까운 순으로 불러온다. 상단 혜택 뱃지 필터는 useBenefitServiceFilters가 맡는다. */
export const useBenefitStores = ({
  activeMapCategory,
  userLocation,
}: UseBenefitStoresParams) => {
  const [benefitCategories, setBenefitCategories] = useState<
    BenefitCategoryOption[]
  >([]);
  const [selectedBenefitCategory, setSelectedBenefitCategory] = useState("");
  const [benefitStores, setBenefitStores] = useState<StoreLocation[]>([]);
  const [isBenefitStoreLoading, setIsBenefitStoreLoading] = useState(false);
  const lastLookupKeyRef = useRef("");
  const lookupLocation = userLocation ?? defaultMapLocation;
  const benefitLookup = useMemo(() => {
    const lat = Number(lookupLocation.lat.toFixed(3));
    const lng = Number(lookupLocation.lng.toFixed(3));

    return {
      key: `${selectedBenefitCategory}:${lat}:${lng}`,
      location: { lat, lng },
    };
  }, [lookupLocation.lat, lookupLocation.lng, selectedBenefitCategory]);

  useEffect(() => {
    let isCurrentRequest = true;

    benefitService
      .fetchBenefitCategories()
      .then((categories) => {
        if (!isCurrentRequest) {
          return;
        }

        setBenefitCategories(categories);
        setSelectedBenefitCategory(
          (currentCategory) => currentCategory || categories[0]?.value || "",
        );
      })
      .catch(() => {
        if (isCurrentRequest) {
          showToast("제휴 혜택 카테고리를 불러오지 못했어요.");
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  useEffect(() => {
    if (activeMapCategory !== "benefit" || !selectedBenefitCategory) {
      return;
    }

    if (lastLookupKeyRef.current === benefitLookup.key) {
      return;
    }

    lastLookupKeyRef.current = benefitLookup.key;
    let isCurrentRequest = true;
    let isSettled = false;

    setIsBenefitStoreLoading(true);

    benefitService
      .fetchBenefitStores(selectedBenefitCategory, benefitLookup.location)
      .then((stores) => {
        isSettled = true;

        if (isCurrentRequest) {
          setBenefitStores(stores);
        }
      })
      .catch(() => {
        isSettled = true;

        if (isCurrentRequest) {
          setBenefitStores([]);
          showToast("제휴 매장 정보를 불러오지 못했어요.");
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsBenefitStoreLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;

      if (!isSettled) {
        lastLookupKeyRef.current = "";
      }
    };
  }, [activeMapCategory, benefitLookup, selectedBenefitCategory]);

  const benefitStoresOrigin: MapSearchPoint = benefitLookup.location;
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
