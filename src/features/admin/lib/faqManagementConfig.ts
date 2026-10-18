import { adminFaqCategories } from "@/features/admin/types";
import type { SelectOption } from "@/shared/ui/atoms/Select";

export const faqCategoryOptions: readonly SelectOption[] =
  adminFaqCategories.map((category) => ({ label: category, value: category }));
export const faqCategoryFilterOptions: readonly SelectOption[] = [
  { label: "전체", value: "ALL" },
  ...faqCategoryOptions,
];
export const faqStatusFilterOptions = [
  { label: "전체", value: "ALL" },
  { label: "활성", value: "ACTIVE" },
  { label: "비활성", value: "INACTIVE" },
] as const;
export const faqSortOptions = [
  { label: "최신 등록순", value: "createdAt:desc" },
  { label: "최근 수정순", value: "updatedAt:desc" },
] as const;
export const faqPageSizeFilterOptions = [20, 50, 100].map((pageSize) => ({
  label: `${pageSize}개`,
  value: String(pageSize),
}));
export const FAQ_MIN_TABLE_ROWS = 8;
