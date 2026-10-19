/** GET /benefits/list 항목 (BE BenefitResponse). 사용자 화면과 관리자 화면이 함께 쓴다. */
export type BenefitSummary = {
  benefitId: number;
  brand: string;
  name: string;
  category: string;
  description: string;
  storeCount: number;
};

/** 제휴 혜택 카테고리. BE Benefit.CATEGORIES와 같다(다른 값은 BE가 400). */
export const adminBenefitCategories = [
  "카페",
  "아이스크림",
  "영화",
  "외식",
  "자동차",
  "쇼핑",
  "여가",
] as const;

export type AdminBenefitCategory = (typeof adminBenefitCategories)[number];

/** GET /admin/benefits 항목 (BE AdminBenefitResponse) */
export type AdminBenefitDetail = Omit<BenefitSummary, "description"> & {
  description: string | null;
  /** 이 혜택에 연결된 제휴 매장 수. 1개 이상이면 삭제할 수 없다(409). */
  storeCount: number;
  createdAt: string;
  updatedAt: string;
};

/** POST /admin/benefits, PATCH /admin/benefits/{id} 요청 (BE BenefitRequest) */
export type AdminBenefitRequest = {
  /** 브랜드명(50자 이내, 중복 불가 409) */
  brand: string;
  /** 혜택 이름(100자 이내) */
  name: string;
  category: AdminBenefitCategory;
  description?: string | null;
};

/** 매장 지도 혜택 탭의 카테고리 선택지. 카테고리별 제휴 매장 수 합계를 함께 둔다. */
export type BenefitCategoryOption = {
  label: string;
  value: string;
  storeCount: number;
};
