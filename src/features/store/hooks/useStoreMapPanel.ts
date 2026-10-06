"use client";

import { useStoreMapPanelActions } from "@/features/store/hooks/useStoreMapPanelActions";
import { useStoreMapPanelState } from "@/features/store/hooks/useStoreMapPanelState";

/** 매장 지도 패널(StoreMapPanel)이 화면을 그리는 데 쓰는 상태와 동작을 한데 모은다. */
export const useStoreMapPanel = () => {
  const state = useStoreMapPanelState();
  const actions = useStoreMapPanelActions(state);

  return { ...state, ...actions };
};
