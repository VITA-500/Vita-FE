import type { ChatStoreMap } from "@/entities/chat";

// LLM이 마지막 `|`을 생략하는 표도 있어 양쪽 경계를 모두 선택적으로 허용한다.
const TABLE_ROW = /^\s*\|?[^\n]*\|[^\n]*\|?\s*$/;
const TABLE_DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/;
const STORE_TABLE_HEADER =
  /매장|지점|주소|거리|영업|전화|서비스|상담|위치|제휴|브랜드|혜택/;

const normalizeText = (value: string) =>
  value.toLowerCase().replace(/[\s|,./()[\]{}\-_:]+/g, "");

const getStoreTokens = (storeMap: ChatStoreMap) =>
  storeMap.stores
    .flatMap((store) => [
      store.name,
      store.name.replace(/^vita\s*/i, "").replace(/^비타\s*/, ""),
      store.address,
      store.phone,
      store.distanceText,
    ])
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalizeText)
    .filter((value) => value.length >= 2);

const isStoreTable = (tableLines: string[], storeTokens: string[]) => {
  const [header = "", , ...rows] = tableLines;

  if (!STORE_TABLE_HEADER.test(header)) return false;
  if (storeTokens.length === 0) return true;

  const normalizedRows = normalizeText(rows.join("\n"));

  return (
    storeTokens.some((token) => normalizedRows.includes(token)) ||
    rows.length > 0
  );
};

const isStoreListLine = (line: string, storeTokens: string[]) => {
  const trimmed = line.trim();
  if (!/^(?:[-*+]\s+|\d+[.)]\s+)/.test(trimmed)) return false;
  const normalized = normalizeText(trimmed);
  // BE 본문 목록과 카드/지도 결과가 서로 다른 추천 목록이어도 중복 표시하지 않는다.
  return (
    storeTokens.some((token) => normalized.includes(token)) ||
    /주소|거리|영업|전화|지점|매장|대리점|m\b|km\b/.test(trimmed)
  );
};

export const stripStoreTablesFromAnswer = (
  content: string,
  storeMap?: ChatStoreMap,
) => {
  if (!storeMap?.stores.length) return content;

  const storeTokens = getStoreTokens(storeMap);

  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const nextLines: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const divider = lines[index + 1];

    if (TABLE_ROW.test(line) && TABLE_DIVIDER.test(divider ?? "")) {
      const tableLines = [line, divider];
      index += 2;

      while (index < lines.length && TABLE_ROW.test(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }

      if (isStoreTable(tableLines, storeTokens)) {
        continue;
      }

      nextLines.push(...tableLines);
      continue;
    }

    nextLines.push(line);
    index += 1;
  }

  return nextLines
    .filter((line) => !isStoreListLine(line, storeTokens))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
