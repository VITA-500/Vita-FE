import type {
  ChatMarkdownBlock,
  ChatMarkdownListItem,
} from "@/features/chat/components/ChatMarkdown";
import type { PlanCardProps } from "@/shared/ui/PlanCard";

/**
 * 챗봇 답변의 요금제 표·목록을 요금제 카드(PlanCard) 데이터로 바꾼다.
 *
 * 지금 채팅 API는 요금제 정보를 구조화된 데이터로 주지 않고 답변 문장(마크다운)에만 담아서,
 * 화면에서 표나 목록 모양을 보고 카드로 바꿔 그린다. BE가 relatedPlans 같은 필드를 주면
 * 이 변환 대신 그 데이터를 그대로 카드에 넣으면 된다.
 *
 * 카드로 바꾸는 경우(그 외에는 원래 표·목록으로 보여준다)
 * - 표: "요금제/상품/이름" 열(또는 "비타 …"로 시작하는 이름 열)과 금액 열이 있고, 모든 행에서 금액을 읽을 수 있을 때
 * - 목록: 모든 항목이 "비타 …" 요금제 이름으로 시작하고 금액(…원)을 담고 있을 때
 */

export type ChatPlanCard = Pick<
  PlanCardProps,
  "badge" | "description" | "features" | "highlighted" | "planName" | "price"
> & { planName: string; price: string };

const PRICE = /(?:월\s*)?(\d{1,3}(?:,\d{3})+|\d{4,})\s*원/;
const PLAN_NAME_PREFIX = /^비타\s/;
const NAME_HEADER = /요금제|상품|이름|플랜/;
const PRICE_HEADER = /요금|가격|월정액|금액|월\s*이용료/;
const RECOMMEND = /추천|최저가|가장\s*(저렴|싼)/;

/** 카드 안에서는 마크다운을 그리지 않으므로 강조 기호만 걷어낸다. */
const stripMarkdown = (text: string) =>
  text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const formatPrice = (rawPrice: string) =>
  Number(rawPrice.replace(/,/g, "")).toLocaleString("ko-KR");

const readPrice = (text: string) => {
  const match = stripMarkdown(text).match(PRICE);
  return match ? formatPrice(match[1]) : null;
};

/** "데이터 5GB, 소진 시 400Kbps / 통화 무제한" → 항목 배열 */
const splitFeatures = (text: string) =>
  stripMarkdown(text)
    .split(/\s*(?:,|·|\/|\||;|\n)\s*/)
    .map((feature) => feature.replace(/^[-–:：)\]]+\s*|[.\s(]+$/g, "").trim())
    .filter((feature) => feature.length > 0);

const withRecommendation = (
  card: ChatPlanCard,
  sourceText: string,
): ChatPlanCard => {
  // PlanCard가 특징 문장을 key로 쓰므로 중복을 없앤다.
  const dedupedCard = {
    ...card,
    features: Array.from(new Set(card.features ?? [])),
  };

  return RECOMMEND.test(sourceText)
    ? { ...dedupedCard, badge: "추천", highlighted: true }
    : dedupedCard;
};

/* ------------------------------------------------------------------ */
/* 표                                                                   */
/* ------------------------------------------------------------------ */

const tableToPlanCards = (
  header: string[],
  rows: string[][],
): ChatPlanCard[] | null => {
  if (rows.length === 0) return null;

  const plainHeader = header.map(stripMarkdown);
  let nameIndex = plainHeader.findIndex((cell) => NAME_HEADER.test(cell));

  if (nameIndex === -1) {
    nameIndex = plainHeader.findIndex((_, columnIndex) =>
      rows.every((row) =>
        PLAN_NAME_PREFIX.test(stripMarkdown(row[columnIndex] ?? "")),
      ),
    );
  }

  const priceIndex = plainHeader.findIndex(
    (cell, columnIndex) =>
      columnIndex !== nameIndex &&
      PRICE_HEADER.test(cell) &&
      rows.every((row) => readPrice(row[columnIndex] ?? "") !== null),
  );

  if (nameIndex === -1 || priceIndex === -1) return null;

  return rows.map((row) => {
    const features = plainHeader
      .map((headerCell, columnIndex) => {
        if (columnIndex === nameIndex || columnIndex === priceIndex)
          return null;
        const value = stripMarkdown(row[columnIndex] ?? "");
        if (!value || value === "-") return null;
        return headerCell ? `${headerCell} ${value}` : value;
      })
      .filter((feature): feature is string => Boolean(feature));

    return withRecommendation(
      {
        planName: stripMarkdown(row[nameIndex] ?? ""),
        price: readPrice(row[priceIndex] ?? "") ?? "",
        features,
      },
      row.join(" "),
    );
  });
};

/* ------------------------------------------------------------------ */
/* 목록                                                                 */
/* ------------------------------------------------------------------ */

/** 항목 맨 앞의 요금제 이름: **굵은 이름**이 있으면 그것, 없으면 첫 구분자 앞까지. */
const readListPlanName = (text: string) => {
  const boldName = text.match(/^\s*\*\*([^*]+)\*\*/)?.[1];
  const candidate = stripMarkdown(
    boldName ?? text.split(/\s*[:：(\-–,]\s*|\s+월\s/)[0] ?? "",
  );

  return PLAN_NAME_PREFIX.test(candidate) ? candidate : null;
};

const listItemToPlanCard = (
  item: ChatMarkdownListItem,
): ChatPlanCard | null => {
  const planName = readListPlanName(item.text);
  const allText = [item.text, ...item.children].join("\n");
  const price = readPrice(allText);

  if (!planName || !price) return null;

  // 이름과 금액 표현을 걷어낸 나머지 문장, 그리고 하위 목록을 특징으로 쓴다.
  const rest = stripMarkdown(item.text)
    .replace(planName, "")
    .replace(PRICE, "")
    .replace(/^[\s:：\-–(),]+|[\s(),]+$/g, "");
  const features = [
    ...splitFeatures(rest),
    ...item.children.flatMap((child) => {
      const plainChild = stripMarkdown(child);
      return PRICE.test(plainChild) &&
        plainChild.replace(PRICE, "").trim().length < 4
        ? []
        : [plainChild];
    }),
  ].filter(
    // "월", "원" 같은 금액 표현의 찌꺼기와 "가장 추천" 같은 표시는 특징이 아니라 뱃지로 보여준다.
    (feature) =>
      !/^(월|원)$/.test(feature) && !/^(가장\s*)?추천$/.test(feature),
  );

  return withRecommendation({ planName, price, features }, allText);
};

export const blockToPlanCards = (
  block: ChatMarkdownBlock,
): ChatPlanCard[] | null => {
  if (block.type === "table") {
    return tableToPlanCards(block.header, block.rows);
  }

  if (block.type === "list") {
    const cards = block.items.map(listItemToPlanCard);
    return cards.length > 0 && cards.every(Boolean)
      ? (cards as ChatPlanCard[])
      : null;
  }

  return null;
};
