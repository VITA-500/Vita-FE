"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 지도 위 패널 배치: 검색 드롭다운·매장 목록 열림 상태, 패널 크기 측정,
 * 핀·경로가 패널에 가리지 않도록 비워 둘 여백, 바깥 클릭·Esc로 닫기.
 */
export const useStorePanelLayout = () => {
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);
  const [isStoreListCollapsed, setIsStoreListCollapsed] = useState(true);
  const [routeLeftInset, setRouteLeftInset] = useState(0);
  const collapsedSearchRef = useRef<HTMLDivElement>(null);
  const panelRootRef = useRef<HTMLDivElement>(null);
  const storeListPanelRef = useRef<HTMLDivElement>(null);
  // 지도 위 상단 영역(검색창 + 필터 뱃지 줄). 핀이 이 아래로 꽂히도록 높이를 잰다.
  const mapTopBarRef = useRef<HTMLDivElement>(null);

  /**
   * 핀을 꽂을 때 비워 둘 여백(지도 기준 px). 매장 목록이 펼쳐져 있는지에 따라 달라진다.
   * - 위: 검색창·필터 줄 아래 + 핀 높이 (모바일에서 목록을 펼쳤으면 목록 아래)
   * - 왼쪽(데스크톱): 목록을 펼쳤으면 목록 오른쪽 끝 + 여유, 접었으면 기본 여유만
   * - 오른쪽·아래: 지도 컨트롤 버튼 자리
   */
  const getMapPinFitPadding = (container: {
    height: number;
    width: number;
  }) => {
    const rootRect = panelRootRef.current?.getBoundingClientRect();
    const topBarRect = mapTopBarRef.current?.getBoundingClientRect();

    if (!rootRect || !topBarRect) {
      return null;
    }

    const listRect = isStoreListCollapsed
      ? null
      : (storeListPanelRef.current?.getBoundingClientRect() ?? null);
    const isDesktop = container.width >= 768;
    // 핀은 좌표 지점에서 위로 46px 솟으므로 그만큼 + 여유를 더 비운다.
    const pinTopSpace = 56;
    const edgeGap = 24;
    const topBarBottom = topBarRect.bottom - rootRect.top;
    const top =
      (!isDesktop && listRect
        ? Math.max(topBarBottom, listRect.bottom - rootRect.top)
        : topBarBottom) + pinTopSpace;
    const left =
      isDesktop && listRect ? listRect.right - rootRect.left + edgeGap : 32;

    return {
      bottom: 56,
      left,
      right: isDesktop ? 96 : 76,
      top,
    };
  };

  // 검색창/매장 목록 패널의 오른쪽 끝(지도 기준 px)을 재서 길찾기 경로 여백으로 쓴다.
  useEffect(() => {
    const panelRoot = panelRootRef.current;
    const searchPanel = collapsedSearchRef.current;

    if (!panelRoot || !searchPanel) {
      return;
    }

    const updateRouteLeftInset = () => {
      const rootRect = panelRoot.getBoundingClientRect();
      const searchRect = searchPanel.getBoundingClientRect();

      setRouteLeftInset(
        Math.max(0, Math.round(searchRect.right - rootRect.left)),
      );
    };

    updateRouteLeftInset();

    const resizeObserver = new ResizeObserver(updateRouteLeftInset);

    resizeObserver.observe(panelRoot);
    resizeObserver.observe(searchPanel);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isSearchHistoryOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        collapsedSearchRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsSearchHistoryOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isSearchHistoryOpen]);

  useEffect(() => {
    if (!isSearchHistoryOpen && isStoreListCollapsed) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsSearchHistoryOpen(false);
      setIsStoreListCollapsed(true);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchHistoryOpen, isStoreListCollapsed]);

  return {
    collapsedSearchRef,
    getMapPinFitPadding,
    isSearchHistoryOpen,
    isStoreListCollapsed,
    mapTopBarRef,
    panelRootRef,
    routeLeftInset,
    setIsSearchHistoryOpen,
    setIsStoreListCollapsed,
    storeListPanelRef,
  };
};
