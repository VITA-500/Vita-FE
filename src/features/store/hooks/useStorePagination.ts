"use client";

import { useEffect, useRef, useState } from "react";
import type { StoreLocation } from "@/features/store/types";

/** 지도 핀(A~L)·매장 목록 한 페이지에 보여줄 매장 수. */
const STORES_PER_PAGE = 12;
/** 페이지 이동 시 지도가 먼저 움직이기 시작한 뒤 핀·목록을 바꾸기까지의 텀(ms) */
const STORE_PAGE_SWITCH_DELAY_MS = 260;

type UseStorePaginationParams = {
  /** 목록·핀으로 보여줄 매장(기준 지점에서 가까운 순) */
  mapStores: StoreLocation[];
  /** 페이지 버튼을 누른 직후(핀·목록이 바뀌기 전) 호출한다. 지도를 새 페이지 핀 쪽으로 옮기는 데 쓴다. */
  onPageChangeStart: (params: {
    mapStoresKey: string;
    nextPage: number;
    pageStores: StoreLocation[];
  }) => void;
};

/**
 * 매장 목록·핀 페이지 나누기.
 * 매장이 12개를 넘으면 12개씩 페이지로 나눈다. 기본은 첫 12개만, "더보기"를 누르면 페이지 이동이 켜진다.
 */
export const useStorePagination = ({
  mapStores,
  onPageChangeStart,
}: UseStorePaginationParams) => {
  const [storePage, setStorePage] = useState(0);
  const [isStorePaginationOn, setIsStorePaginationOn] = useState(false);
  // 페이지 버튼을 누른 뒤 실제로 핀·목록이 바뀌기 전까지 이동할 페이지(번호 강조는 바로 바꾼다)
  const [pendingStorePage, setPendingStorePage] = useState<number | null>(null);
  const [storePageSourceKey, setStorePageSourceKey] = useState("");
  const storePageSwitchTimeoutRef = useRef<number | undefined>(undefined);
  const latestMapStoresKeyRef = useRef("");

  useEffect(
    () => () => {
      window.clearTimeout(storePageSwitchTimeoutRef.current);
    },
    [],
  );

  const mapStoresKey = mapStores.map((store) => store.id).join(",");

  // 매장 목록 자체가 바뀌면(새 조회·검색·필터) 첫 페이지로 돌아가고 페이지 이동을 끈다.
  if (storePageSourceKey !== mapStoresKey) {
    setStorePageSourceKey(mapStoresKey);
    setStorePage(0);
    setPendingStorePage(null);
    setIsStorePaginationOn(false);
  }

  // 첫 페이지(처음 보여주는 핀)는 기준 지점(중심 좌표)에서 가까운 순 12개. 나머지는 12개씩 다음 페이지.
  const firstPageSize = Math.min(STORES_PER_PAGE, mapStores.length);
  const getStorePageRange = (page: number) =>
    page === 0
      ? { end: firstPageSize, start: 0 }
      : {
          end: firstPageSize + page * STORES_PER_PAGE,
          start: firstPageSize + (page - 1) * STORES_PER_PAGE,
        };
  const storePageCount =
    1 +
    Math.max(
      0,
      Math.ceil((mapStores.length - firstPageSize) / STORES_PER_PAGE),
    );
  const currentStorePage = Math.min(storePage, storePageCount - 1);
  const currentStorePageRange = getStorePageRange(currentStorePage);
  const pagedMapStores = mapStores.slice(
    currentStorePageRange.start,
    currentStorePageRange.end,
  );
  const hasMoreStorePages = storePageCount > 1;

  useEffect(() => {
    latestMapStoresKeyRef.current = mapStoresKey;
  }, [mapStoresKey]);
  // 페이지 버튼 강조·이전/다음 기준은 바뀔 예정인 페이지를 먼저 따른다.
  const activeStorePage = Math.min(
    pendingStorePage ?? currentStorePage,
    storePageCount - 1,
  );
  /**
   * 페이지 이동: 지도를 먼저 부드럽게 옮기기 시작하고, 잠깐(텀) 뒤에 핀·목록을 새 페이지로 바꾼다.
   * 새 핀·목록은 서서히 나타난다. 연달아 누르면 마지막으로 누른 페이지만 반영한다.
   */
  const goToStorePage = (page: number) => {
    const nextPage = Math.min(Math.max(0, page), storePageCount - 1);
    const nextPageRange = getStorePageRange(nextPage);
    const pageStores = mapStores.slice(nextPageRange.start, nextPageRange.end);
    const sourceKey = mapStoresKey;

    setPendingStorePage(nextPage);
    onPageChangeStart({ mapStoresKey, nextPage, pageStores });

    window.clearTimeout(storePageSwitchTimeoutRef.current);
    storePageSwitchTimeoutRef.current = window.setTimeout(() => {
      setPendingStorePage(null);

      // 그사이 매장 목록 자체가 바뀌었으면(새 검색 등) 이전 목록 기준 페이지는 적용하지 않는다.
      if (latestMapStoresKeyRef.current === sourceKey) {
        setStorePage(nextPage);
      }
    }, STORE_PAGE_SWITCH_DELAY_MS);
  };

  return {
    activeStorePage,
    currentStorePage,
    firstPageSize,
    goToStorePage,
    hasMoreStorePages,
    isStorePaginationOn,
    mapStoresKey,
    pagedMapStores,
    showStorePagination: () => setIsStorePaginationOn(true),
    storePageCount,
  };
};
