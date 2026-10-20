import type { StoreMapSnapshot } from "@/features/store/panel/lib/storeMapSnapshot";
import type { StoreMapInitialAction } from "@/features/store/types";

export type StoreMapPanelProps = {
  initialAction?: StoreMapInitialAction | null;
  onOpenSidebar?: () => void;
};

export type StoreMapPanelContentProps = StoreMapPanelProps & {
  /** 로그인하러 가기 전에 보던 지도 화면(있으면 그대로 되살린다) */
  restoredSnapshot?: StoreMapSnapshot | null;
};
