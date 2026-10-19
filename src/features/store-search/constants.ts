import { BadgePercent, Store } from "lucide-react";
import type { MapCategory } from "@/features/store-search/types";

export const mapCategoryOptions: {
  icon: typeof Store | typeof BadgePercent;
  label: string;
  value: MapCategory;
}[] = [
  { icon: Store, label: "매장", value: "store" },
  { icon: BadgePercent, label: "혜택", value: "benefit" },
];

/** 검색 드롭다운에 보여줄 최대 결과 수(스크롤로 확인). */
export const MAX_SEARCH_RESULT_COUNT = 30;
