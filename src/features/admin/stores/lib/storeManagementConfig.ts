import type { AdminStoreType } from "@/entities/store";

export const STORE_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
export const STORE_MIN_TABLE_ROWS = 8;
export const storeSortOptions = [
  {
    direction: "desc",
    field: "createdAt",
    label: "최신 등록순",
    value: "createdAt:desc",
  },
  {
    direction: "desc",
    field: "updatedAt",
    label: "최근 수정순",
    value: "updatedAt:desc",
  },
] as const;
export const storePageSizeFilterOptions = STORE_PAGE_SIZE_OPTIONS.map(
  (pageSize) => ({
    label: `${pageSize}개`,
    value: String(pageSize),
  }),
);
export const storeTypeLabels: Record<
  AdminStoreType,
  { emptyName: string; name: string; title: string }
> = {
  PHONE: { emptyName: "대리점", name: "대리점", title: "대리점 관리" },
  PARTNER: { emptyName: "제휴점", name: "제휴점", title: "제휴점 관리" },
};
