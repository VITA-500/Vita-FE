import type {
  ChatMarkdownBlock,
  ChatMarkdownListItem,
} from "@/features/chat/components/ChatMarkdown";
import { blockToPlanCards } from "@/features/chat/lib/chatPlanCards";

/**
 * 챗봇 답변(마크다운 블록)에서 "절차 · 준비물 · 주의사항" 구간을 찾아 안내 카드로 묶는다.
 *
 * 채팅 API는 답변을 문장(마크다운) 하나로만 주기 때문에, 제목과 목록 모양을 보고 판단한다.
 * - 절차 → StepGuideCard : 번호 목록 + 제목·바로 앞 안내 문장에 절차/방법/단계/순서 등
 *   (차이/비교/특징 같은 설명형 제목이거나, 제목 없이 번호 목록만 있으면 일반 목록으로 둔다)
 * - 준비물 → ChecklistCard : 목록 + 제목에 준비물/서류/필요한/지참/조건 등
 * - 주의사항 → WarningNotice : 제목에 주의/유의/참고/알아두 등, 또는 그런 단어가 있는 인용(>) · "※" 문단
 * 판단 기준에 맞지 않으면 원래 마크다운 그대로 보여준다.
 */

export type ChatAnswerStep = {
  title: string;
  description: string[];
};

export type ChatAnswerUnit =
  | { type: "block"; block: ChatMarkdownBlock }
  | { type: "steps"; title?: string; steps: ChatAnswerStep[] }
  | { type: "checklist"; title?: string; items: ChatMarkdownListItem[] }
  | { type: "notice"; title?: string; blocks: ChatMarkdownBlock[] };

const STEP_KEYWORDS = /절차|방법|단계|순서|과정|진행|신청|하는\s*법|따라/;
/** 차이·비교·특징처럼 순서가 없는 설명은 번호 목록이어도 절차 카드로 만들지 않는다. */
const COMPARE_KEYWORDS = /차이|비교|장점|단점|특징|종류|구분|vs/i;

const isStepLabel = (text: string) =>
  STEP_KEYWORDS.test(text) && !COMPARE_KEYWORDS.test(text);
const CHECKLIST_KEYWORDS =
  /준비물|준비\s*서류|필요\s*서류|구비|지참|챙겨|필요한\s*(것|서류|준비)|자격|조건/;
const NOTICE_KEYWORDS =
  /주의|유의|참고|알아두|꼭\s*확인|확인해\s*주세요|안내\s*사항|위약금/;
const NOTICE_LEAD = /^\s*(※|⚠️?|💡|참고\s*[:：]|주의\s*[:：]|유의\s*[:：])/;

/** "**제목**" 한 줄이나 마크다운 제목(#)은 다음 목록의 카드 제목으로 쓴다. */
const readLabel = (
  block: ChatMarkdownBlock | undefined,
): { text: string; consumable: boolean } | null => {
  if (!block) return null;

  if (block.type === "heading") {
    return { text: block.text, consumable: true };
  }

  if (block.type === "paragraph" && block.lines.length === 1) {
    const line = block.lines[0].trim();
    const boldOnly = line.match(/^\*\*([^*]+)\*\*\s*[:：]?$/);

    if (boldOnly) {
      return { text: boldOnly[1].trim(), consumable: true };
    }

    // "아래 순서로 진행해 주세요:"처럼 콜론으로 끝나는 안내 문장은 판단에만 쓰고 그대로 보여준다.
    if (/[:：]$/.test(line)) {
      return { text: line, consumable: false };
    }
  }

  return null;
};

const stripMarkdown = (text: string) =>
  text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();

/** "**본인 확인**: 신분증으로 확인해요" → 제목 "본인 확인", 설명 "신분증으로 확인해요" */
const toStep = (item: ChatMarkdownListItem): ChatAnswerStep => {
  const [firstLine, ...restLines] = item.text.split("\n");
  const boldLead = firstLine.match(/^\*\*([^*]+)\*\*\s*[:：\-–]?\s*(.*)$/);
  const colonLead = firstLine.match(/^([^:：]{1,24})[:：]\s*(.+)$/);

  const [title, firstDescription] = boldLead
    ? [boldLead[1], boldLead[2]]
    : colonLead
      ? [colonLead[1], colonLead[2]]
      : [firstLine, ""];

  return {
    title: stripMarkdown(title),
    description: [firstDescription, ...restLines, ...item.children]
      .map((line) => line.trim())
      .filter(Boolean),
  };
};

const isNoticeParagraph = (block: ChatMarkdownBlock) =>
  (block.type === "paragraph" && NOTICE_LEAD.test(block.lines[0] ?? "")) ||
  (block.type === "quote" && NOTICE_KEYWORDS.test(block.lines.join(" ")));

export const groupAnswerCards = (
  blocks: readonly ChatMarkdownBlock[],
): ChatAnswerUnit[] => {
  const units: ChatAnswerUnit[] = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];
    const label = readLabel(block);
    const next = blocks[index + 1];

    // 1) 제목 + 바로 다음 목록 → 카드 후보 (요금제 목록은 요금제 카드가 우선)
    if (label && next?.type === "list" && !blockToPlanCards(next)) {
      const title = label.consumable
        ? label.text.replace(/[:：]$/, "")
        : undefined;
      const carry = label.consumable ? [] : [block];

      if (NOTICE_KEYWORDS.test(label.text)) {
        carry.forEach((item) => units.push({ type: "block", block: item }));
        units.push({ type: "notice", title, blocks: [next] });
        index += 2;
        continue;
      }

      if (CHECKLIST_KEYWORDS.test(label.text)) {
        carry.forEach((item) => units.push({ type: "block", block: item }));
        units.push({ type: "checklist", title, items: next.items });
        index += 2;
        continue;
      }

      if (next.ordered && next.items.length >= 2 && isStepLabel(label.text)) {
        carry.forEach((item) => units.push({ type: "block", block: item }));
        units.push({ type: "steps", title, steps: next.items.map(toStep) });
        index += 2;
        continue;
      }
    }

    // 2) 제목 + 바로 다음 문단 → 주의사항 제목이면 안내 박스
    if (
      label?.consumable &&
      NOTICE_KEYWORDS.test(label.text) &&
      next?.type === "paragraph"
    ) {
      units.push({ type: "notice", title: label.text, blocks: [next] });
      index += 2;
      continue;
    }

    // 3) "아래 순서대로 진행해 주세요." 같은 안내 문단 + 바로 다음 번호 목록 → 절차
    //    (문단은 그대로 보여주고, 제목 없이 번호 목록만 절차 카드로)
    //    제목·안내 문장 없이 번호 목록만 있으면 순서가 있는 절차인지 알 수 없어서 일반 목록으로 둔다.
    if (
      block.type === "paragraph" &&
      isStepLabel(block.lines[block.lines.length - 1] ?? "") &&
      next?.type === "list" &&
      next.ordered &&
      next.items.length >= 2 &&
      !blockToPlanCards(next)
    ) {
      units.push({ type: "block", block });
      units.push({ type: "steps", steps: next.items.map(toStep) });
      index += 2;
      continue;
    }

    // 4) "※ …" 문단, 주의 단어가 있는 인용(>) → 안내 박스
    if (isNoticeParagraph(block)) {
      // 안내 박스에 이미 경고 아이콘이 있으니 문단 앞의 "※", "⚠️" 기호는 뺀다.
      const noticeBlock: ChatMarkdownBlock =
        block.type === "paragraph"
          ? {
              ...block,
              lines: [
                block.lines[0].replace(/^\s*(※|⚠️?|💡)\s*/, ""),
                ...block.lines.slice(1),
              ],
            }
          : block;
      units.push({ type: "notice", blocks: [noticeBlock] });
      index += 1;
      continue;
    }

    units.push({ type: "block", block });
    index += 1;
  }

  return units;
};
