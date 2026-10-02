/**
 * 페이지 버튼 목록. 페이지가 많으면 처음·끝·현재 주변만 남기고 나머지는 "…"로 줄인다.
 * 예) 현재 6/12 → 1 … 5 6 7 … 12
 */
export const getPaginationItems = (
  currentPage: number,
  pageCount: number,
): (number | "ellipsis")[] => {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, page) => page);
  }

  const lastPage = pageCount - 1;
  const start = Math.max(1, Math.min(currentPage - 1, lastPage - 4));
  const end = Math.min(lastPage - 1, Math.max(currentPage + 1, 4));
  const items: (number | "ellipsis")[] = [0];

  // 한 페이지만 건너뛰는 경우엔 "…" 대신 그 번호를 그대로 보여준다.
  if (start === 2) items.push(1);
  else if (start > 2) items.push("ellipsis");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end === lastPage - 2) items.push(lastPage - 1);
  else if (end < lastPage - 2) items.push("ellipsis");
  items.push(lastPage);

  return items;
};
