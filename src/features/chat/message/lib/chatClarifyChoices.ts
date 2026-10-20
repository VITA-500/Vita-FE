/**
 * 챗봇이 답하기 전에 되묻는 질문("어떤 목적으로 방문하시나요?")의 선택지를 답변 글에서 찾는다.
 *
 * 채팅 API는 답변을 문장(마크다운) 하나로만 주기 때문에 글 모양으로 판단한다.
 * 잘못 찾으면 일반 목록이 버튼으로 바뀌므로 조건을 좁게 잡는다.
 * - 짧은 목록(2~6개, 항목이 짧고 설명·콜론·링크가 없음)이 있고
 * - 그 목록 바로 앞이나 뒤(빈 줄 제외 2줄 안)에 되묻는 문장이 있을 때만 선택지로 본다.
 * - "기타 문의"처럼 고르기만으로 답할 수 없는 항목은 버튼으로 만들지 않고 직접 입력을 안내한다.
 */

export type ChatClarifyChoices = {
  /** 버튼으로 보여줄 항목. 누르면 항목 글자를 그대로 질문으로 보낸다. */
  choices: string[];
  /** "기타" 같은 항목이 있어 직접 입력도 안내할지 */
  hasOtherOption: boolean;
  /** 선택지 목록 줄을 뺀 답변 글. 버튼을 보여줄 때 같은 내용이 두 번 보이지 않게 쓴다. */
  contentWithoutChoices: string;
};

const MIN_CHOICES = 2;
const MAX_CHOICES = 6;
const MAX_CHOICE_LENGTH = 20;
const CUE_DISTANCE = 2;

const LIST_ITEM = /^\s*(?:[-*•]|\d+[.)])\s+(.+?)\s*$/;
const CLARIFY_CUE =
  /알려\s*주시면|말씀해\s*주세요|말씀해\s*주시면|선택해\s*주세요|골라\s*주세요|어떤\s*.{0,20}(인가요|이신가요|하시나요|하실|이실|원하시)|중\s*(어떤|무엇|어느)|어느\s*.{0,10}(인가요|이신가요|하시나요)/;
const OTHER_OPTION = /^(기타|그\s*외|그\s*밖|직접\s*입력)/;

/** 마크다운 강조·끝 문장부호를 지운 항목 글자 */
const toChoiceText = (raw: string) =>
  raw
    .replace(/\*\*|__|`/g, "")
    .replace(/[.。!?！？]+$/, "")
    .trim();

const isShortChoice = (text: string) =>
  text.length > 0 &&
  text.length <= MAX_CHOICE_LENGTH &&
  !/[:：]|https?:\/\/|\[.*\]\(/.test(text);

/**
 * 선택지를 눌렀을 때 보낼 질문. 항목만 보내면 BE 검색어가 짧아 자료를 못 찾기 쉬워서,
 * 되묻게 만든 원래 질문과 합쳐 보낸다. 예: "기기변경의 경우, 매장 방문할 때 필요한 준비물 알려줘"
 */
export const toClarifiedPrompt = (choice: string, question: string) => {
  const trimmedQuestion = question.trim();

  return trimmedQuestion ? `${choice}의 경우, ${trimmedQuestion}` : choice;
};

export const findClarifyChoices = (
  content: string,
): ChatClarifyChoices | null => {
  const lines = content.split("\n");

  // 마지막 목록 묶음을 찾는다(되묻는 질문은 보통 답변 끝에 있다).
  let end = -1;
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (LIST_ITEM.test(lines[index])) {
      end = index;
      break;
    }
  }
  if (end < 0) return null;

  let start = end;
  while (start > 0 && LIST_ITEM.test(lines[start - 1])) start -= 1;

  const items = lines
    .slice(start, end + 1)
    .map((line) => toChoiceText(line.match(LIST_ITEM)?.[1] ?? ""));

  if (
    items.length < MIN_CHOICES ||
    items.length > MAX_CHOICES ||
    !items.every(isShortChoice)
  ) {
    return null;
  }

  // 목록에 붙은 들여쓴 하위 설명이 있으면 선택지가 아니라 설명 목록이다.
  if (lines[end + 1]?.match(/^\s{2,}\S/)) return null;

  const nearbyLines = (from: number, step: 1 | -1) => {
    const found: string[] = [];
    for (
      let index = from;
      index >= 0 && index < lines.length && found.length < CUE_DISTANCE;
      index += step
    ) {
      if (lines[index].trim()) found.push(lines[index]);
    }
    return found;
  };
  const hasCue = [
    ...nearbyLines(start - 1, -1),
    ...nearbyLines(end + 1, 1),
  ].some((line) => CLARIFY_CUE.test(line));

  if (!hasCue) return null;

  const choices = items.filter((item) => !OTHER_OPTION.test(item));

  if (choices.length < MIN_CHOICES) return null;

  return {
    choices,
    hasOtherOption: choices.length !== items.length,
    contentWithoutChoices: [...lines.slice(0, start), ...lines.slice(end + 1)]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  };
};
