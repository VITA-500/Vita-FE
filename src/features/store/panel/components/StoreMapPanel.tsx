"use client";

import { useSavedStoreMapSnapshot } from "@/features/store/panel/hooks/useSavedStoreMapSnapshot";
import { StoreMapPanelContent } from "@/features/store/panel/components/StoreMapPanelContent";
import type { StoreMapPanelProps } from "@/features/store/panel/lib/storeMapPanelTypes";

/**
 * 매장 지도 화면.
 * 로그인하러 가기 전에 보던 지도 화면이 보관돼 있으면, 화면을 띄운 뒤 읽어 그 상태로 다시 그린다.
 * (서버에서 그린 HTML과 첫 화면이 달라지지 않도록 저장소는 화면을 띄운 뒤에 읽는다)
 * 채팅 등에서 특정 매장을 열며 들어온 경우(initialAction)는 그 동작을 우선하고 되살리지 않는다.
 */
export const StoreMapPanel = ({
  initialAction,
  onOpenSidebar,
}: StoreMapPanelProps) => {
  const restoredSnapshot = useSavedStoreMapSnapshot(!initialAction);

  return (
    <StoreMapPanelContent
      // 보관한 화면을 읽으면 처음 값부터 다시 시작하도록 새로 그린다.
      key={restoredSnapshot ? `restored:${restoredSnapshot.savedAt}` : "fresh"}
      initialAction={initialAction}
      onOpenSidebar={onOpenSidebar}
      restoredSnapshot={restoredSnapshot}
    />
  );
};
