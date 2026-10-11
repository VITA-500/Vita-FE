"use client";

import { useEffect, useMemo, useRef } from "react";
import { useStoreMapPanelActions } from "@/features/store/hooks/useStoreMapPanelActions";
import { useStoreMapPanelState } from "@/features/store/hooks/useStoreMapPanelState";
import type { StoreMapInitialAction } from "@/features/store/types";

/** 매장 지도 패널(StoreMapPanel)이 화면을 그리는 데 쓰는 상태와 동작을 한데 모은다. */
export const useStoreMapPanel = (
  initialAction?: StoreMapInitialAction | null,
) => {
  const state = useStoreMapPanelState();
  const actions = useStoreMapPanelActions(state);
  const handledInitialActionKeyRef = useRef("");
  const initialActionKey = useMemo(() => {
    if (!initialAction) return "";

    return [
      initialAction.action,
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

  return { ...state, ...actions };
};
