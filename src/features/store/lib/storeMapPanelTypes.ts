import type { StoreMapInitialAction } from "@/features/store/types";

export type StoreMapPanelProps = {
  initialAction?: StoreMapInitialAction | null;
  onOpenSidebar?: () => void;
};
