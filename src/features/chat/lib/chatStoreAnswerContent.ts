import type { ChatStoreMap } from "@/features/chat/types";

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const STORE_TABLE_HEADER = /매장|지점|주소|거리|영업|전화|서비스|상담|위치/;

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
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
