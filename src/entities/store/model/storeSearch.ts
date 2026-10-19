import type { StoreLocation } from "@/entities/store/model/types";

const normalizeSearchText = (value: string) =>
  value.replace(/\s/g, "").toLowerCase();

/**
 * 매장 검색 매칭 기준: 매장명 / 주소(도로명·지번) / 전화번호를 **각각** 비교한다.
 * - 필드를 이어 붙여 비교하면 "매장명 끝 + 주소 앞"처럼 경계를 넘는 오탐이 생겨 분리했다.
 * - 전화번호는 하이픈·공백을 무시하고 숫자끼리 비교한다.
 * - 주변/전국 조회 응답에는 주소·전화번호가 없어서, 상세 조회 전 매장은 사실상 매장명으로만 검색된다.
 */
export const matchesStoreSearch = (store: StoreLocation, query: string) => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  if (
    normalizeSearchText(store.name).includes(normalizedQuery) ||
    normalizeSearchText(store.address ?? "").includes(normalizedQuery)
  ) {
    return true;
  }

  const queryDigits = normalizedQuery.replace(/\D/g, "");
  const phoneDigits = (store.phone ?? "").replace(/\D/g, "");

  return (
    queryDigits.length >= 3 &&
    queryDigits.length === normalizedQuery.replace(/-/g, "").length &&
    phoneDigits.includes(queryDigits)
  );
};
