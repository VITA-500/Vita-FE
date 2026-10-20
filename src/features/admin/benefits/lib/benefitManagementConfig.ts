import { adminBenefitCategories } from "@/entities/benefit";

export const benefitCategoryFilterOptions = [
  { label: "전체", value: "ALL" },
  ...adminBenefitCategories.map((category) => ({
    label: category,
    value: category,
  })),
];
export const benefitSortOptions = [
  { label: "최신 등록순", value: "createdAt,desc" },
  { label: "최근 수정순", value: "updatedAt,desc" },
  { label: "브랜드 이름순", value: "brand,asc" },
] as const;
export const benefitPageSizeOptions = [20, 50, 100].map((pageSize) => ({
  label: `${pageSize}개`,
  value: String(pageSize),
}));
export const BENEFIT_MIN_TABLE_ROWS = 8;
