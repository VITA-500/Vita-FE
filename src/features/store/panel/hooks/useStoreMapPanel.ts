"use client";

import { useEffect, useMemo, useRef } from "react";
import { useStoreMapPanelActions } from "@/features/store/panel/hooks/useStoreMapPanelActions";
import { useStoreMapPanelState } from "@/features/store/panel/hooks/useStoreMapPanelState";
import {
  clearStoreMapSnapshot,
  saveStoreMapSnapshot,
  STORE_MAP_RETURN_PATH,
  type StoreMapSnapshot,
} from "@/features/store/panel/lib/storeMapSnapshot";
import type { StoreMapInitialAction } from "@/features/store/types";

/** 매장 지도 패널(StoreMapPanel)이 화면을 그리는 데 쓰는 상태와 동작을 한데 모은다. */
export const useStoreMapPanel = (
  initialAction?: StoreMapInitialAction | null,
  restoredSnapshot: StoreMapSnapshot | null = null,
) => {
  const state = useStoreMapPanelState(restoredSnapshot);
  const actions = useStoreMapPanelActions(state);
  const handledInitialActionKeyRef = useRef("");
  const initialActionKey = useMemo(() => {
    if (!initialAction) return "";

    return [
      initialAction.action,
      initialAction.category ?? "",
      initialAction.benefitCategory ?? "",
      initialAction.storeId,
      initialAction.routeMode ?? "",
    ].join(":");
  }, [initialAction]);

  useEffect(() => {
    if (!initialAction || !initialActionKey) return;
    if (handledInitialActionKeyRef.current === initialActionKey) return;

    handledInitialActionKeyRef.current = initialActionKey;
    void actions.handleInitialStoreAction(initialAction);
  }, [actions, initialAction, initialActionKey]);

  // 되살린 기록은 한 번만 쓴다. (다시 들어올 때 또 되살아나지 않도록 화면을 띄운 뒤 지운다)
  useEffect(() => {
    if (restoredSnapshot) {
      clearStoreMapSnapshot();
    }
  }, [restoredSnapshot]);

  // 로그인 전에 예약하려던 매장이 있으면, 로그인 상태를 확인한 뒤 예약을 이어서 연다.
  const pendingReservationStore = restoredSnapshot?.pendingReservationStore;
  const handledPendingReservationRef = useRef(false);
  const { handleReserve, isAuthenticated, isAuthLoading } = state;

  useEffect(() => {
    if (
      !pendingReservationStore ||
      handledPendingReservationRef.current ||
      isAuthLoading
    ) {
      return;
    }

    handledPendingReservationRef.current = true;

    // 로그인하지 않고 돌아왔으면 보던 화면만 되살리고 예약은 열지 않는다.
    if (isAuthenticated) {
      handleReserve(pendingReservationStore);
    }
  }, [handleReserve, isAuthenticated, isAuthLoading, pendingReservationStore]);

  /** 로그인하러 가기 직전: 지금 보던 지도 화면(검색·필터·위치·고른 매장·예약하려던 매장)을 보관한다. */
  const saveMapStateBeforeLogin = () => {
    // 태그/영역 검색 결과는 submittedSearchStores에만 있고, 원본 stores가
    // 비어 있을 수 있다. 복귀 후 기본 조회로 되돌아가지 않도록 화면에
    // 실제로 사용 중인 결과를 복원 목록으로 저장한다.
    const snapshotStores =
      state.stores.length > 0
        ? state.stores
        : (state.submittedSearchStores ?? state.mapStores);

    if (process.env.NODE_ENV === "development") {
      console.log("[store snapshot] save before login", {
        selectedStoreId: state.selectedStoreId,
        stores: state.stores.length,
        submittedSearchStores: state.submittedSearchStores?.length ?? 0,
        mapStores: state.mapStores.length,
        snapshotStores: snapshotStores.length,
        consultServiceFilters: state.consultServiceFilters,
        providedServiceFilters: state.providedServiceFilters,
        openFilter: state.openFilter,
        pendingReservationStoreId: state.loginRequiredStore?.id,
      });
    }

    saveStoreMapSnapshot({
      activeMapCategory: state.activeMapCategory,
      allStores: state.allStores,
      consultServiceFilters: state.consultServiceFilters,
      hasSelectedStoreInfo: state.hasSelectedStoreInfo,
      isStoreListCollapsed: state.isStoreListCollapsed,
      mapViewport: state.mapViewport,
      openFilter: state.openFilter,
      pendingReservationStore: state.loginRequiredStore,
      providedServiceFilters: state.providedServiceFilters,
      searchAnchorSource: state.searchAnchorSource,
      searchQuery: state.searchQuery,
      selectedBenefitCategory: state.selectedBenefitCategory,
      selectedStoreId: state.selectedStoreId,
      soloStoreId: state.soloStoreId,
      stores: snapshotStores,
      storesOrigin: state.storesOrigin,
      submittedSearchOrigin: state.submittedSearchOrigin,
      submittedSearchStores: state.submittedSearchStores,
    });
  };

  return {
    ...state,
    ...actions,
    /** 지도를 처음 만들 때의 확대 레벨(되살린 화면이면 그때 레벨) */
    initialMapLevel: restoredSnapshot?.mapViewport?.level,
    /** 로그인 후 돌아올 주소(일회성 매장 선택·길찾기 없이 지도만 연다) */
    loginReturnTo: STORE_MAP_RETURN_PATH,
    saveMapStateBeforeLogin,
  };
};

export type StoreMapPanelModel = ReturnType<typeof useStoreMapPanel>;
