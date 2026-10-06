import { BadgePercent, Store } from "lucide-react";
import type { MapCategory } from "@/features/store/types";

export const mapCategoryOptions: {
  icon: typeof Store | typeof BadgePercent;
  label: string;
  value: MapCategory;
}[] = [
  { icon: Store, label: "매장", value: "store" },
  { icon: BadgePercent, label: "혜택", value: "benefit" },
];
export const benefitServicePreviewItems = [
  {
    description:
      "멤버십 제휴 매장과 서비스 혜택을 이 영역에 표시할 예정입니다.",
    title: "제휴 혜택 준비 중",
  },
  {
    description:
      "혜택 API가 연결되면 카테고리별 제휴처를 지도와 함께 확인할 수 있어요.",
    title: "서비스 목록 연동 예정",
  },
];

/** 검색 드롭다운에 보여줄 최대 결과 수(스크롤로 확인). */
export const MAX_SEARCH_RESULT_COUNT = 30;
