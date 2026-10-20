/**
 * 스트리밍 중인 답변을 "글자 단위로 보여줄 글"과 "한 번에 보여줄 덩어리(목록·표·카드)"로 나눈다.
 *
 * 목록·표·안내 카드는 줄이 하나씩 붙을 때마다 모양이 바뀌어서(일반 글 → 카드, 항목 추가로 높이 변화)
 * 글자 단위로 보여주면 말풍선이 들썩인다. 그래서 덩어리가 끝날 때까지는 로딩 블록을 보여주고,
 * 다 받은 뒤에 통째로 보여준다. 판단 기준은 ChatMarkdown(parseChatMarkdown)과 groupAnswerCards를 따른다.
 */

export type ChatStreamSegment =
  | { kind: "text"; start: number; end: number }
  /** complete가 false면 아직 받는 중이라 로딩 블록을 보여준다. */
  | { kind: "block"; start: number; end: number; complete: boolean }
  /** 제목 줄처럼 다음 줄을 봐야 글인지 카드 제목인지 알 수 있는 구간. 다음 줄이 올 때까지 멈춘다. */
  | { kind: "hold"; start: number; end: number };

const HEADING = /^\s*#{1,6}\s+/;
const BOLD_LABEL = /^\s*\*\*[^*]+\*\*\s*[:：]?\s*$/;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;
const TABLE_ROW = /^\s*\|/;
const FENCE = /^\s*```/;
const QUOTE = /^\s*>/;
const NOTICE_LEAD = /^\s*(※|⚠️?|💡|참고\s*[:：]|주의\s*[:：]|유의\s*[:：])/;
const NOTICE_KEYWORDS =
  /주의|유의|참고|알아두|꼭\s*확인|확인해\s*주세요|안내\s*사항|위약금/;
/** 줄이 덜 왔을 때, 이 글자로 시작하면 목록·표·제목일 수 있어 줄이 끝날 때까지 기다린다. */
const STRUCTURE_FIRST_CHAR = /^\s*([-*+#|>`※⚠💡]|\d)/;

const isBlank = (line: string) => line.trim() === "";
const indentOf = (line: string) => line.match(/^\s*/)?.[0].length ?? 0;
const isLabelLine = (line: string) =>
  HEADING.test(line) || BOLD_LABEL.test(line);
const isStructureStart = (line: string) =>
  LIST_ITEM.test(line) ||
  TABLE_ROW.test(line) ||
  FENCE.test(line) ||
  QUOTE.test(line) ||
  NOTICE_LEAD.test(line);

type Line = { text: string; start: number; end: number; isComplete: boolean };

const splitLines = (content: string, isDone: boolean): Line[] => {
  const lines: Line[] = [];
  let start = 0;

  content.split("\n").forEach((text, index, all) => {
    const isLast = index === all.length - 1;
    const end = start + text.length + (isLast ? 0 : 1);

    lines.push({ text, start, end, isComplete: !isLast || isDone });
    start = end;
  });

  // "…\n"으로 끝나면 split 결과 마지막이 빈 문자열이다. 아직 시작도 안 한 줄이라 뺀다.
  if (lines.length > 0 && lines.at(-1)?.text === "" && !isDone) {
    lines.pop();
  }

  return lines;
};

const nextNonBlank = (lines: Line[], from: number) => {
  let index = from;

  while (index < lines.length && isBlank(lines[index].text)) index += 1;

  return index;
};

/**
 * index에서 시작하는 덩어리가 끝나는 줄 번호(다음 덩어리의 시작)를 돌려준다.
 * 끝을 확인하지 못했으면(받은 글의 끝까지 이어지면) complete=false.
 */
const findBlockEnd = (
  lines: Line[],
  index: number,
  isDone: boolean,
): { endIndex: number; complete: boolean } => {
  const first = lines[index].text;
  let cursor = index + 1;

  const result = (endIndex: number) => ({
    endIndex,
    complete: isDone || endIndex < lines.length,
  });

  if (FENCE.test(first)) {
    while (cursor < lines.length && !FENCE.test(lines[cursor].text)) {
      cursor += 1;
    }

    if (cursor < lines.length && lines[cursor].isComplete) {
      return { endIndex: cursor + 1, complete: true };
    }

    return { endIndex: lines.length, complete: isDone };
  }

  // "※ …" 안내 문단, 주의 제목 아래 문단: 빈 줄이 나올 때까지 한 덩어리
  if (NOTICE_LEAD.test(first) || !isStructureStart(first)) {
    while (cursor < lines.length && !isBlank(lines[cursor].text)) {
      cursor += 1;
    }

    return result(cursor);
  }

  const continues = (line: string) => {
    if (TABLE_ROW.test(first)) return TABLE_ROW.test(line);
    if (QUOTE.test(first)) return QUOTE.test(line);

    // 목록: 같은 목록 항목이거나, 들여쓴 하위 항목·이어지는 줄
    return (
      LIST_ITEM.test(line) ||
      (!isBlank(line) && indentOf(line) >= indentOf(first) + 2)
    );
  };

  while (cursor < lines.length) {
    const line = lines[cursor].text;

    if (isBlank(line)) {
      // 항목 사이 빈 줄은 다음 줄이 같은 목록이면 이어서 본다(파서와 같은 규칙).
      const next = nextNonBlank(lines, cursor);

      if (next >= lines.length) {
        return { endIndex: lines.length, complete: isDone };
      }

      if (
        TABLE_ROW.test(first) ||
        QUOTE.test(first) ||
        !continues(lines[next].text)
      ) {
        return { endIndex: cursor, complete: true };
      }

      cursor = next;
      continue;
    }

    if (!continues(line)) {
      // 덜 온 줄이 들여쓰기나 목록 기호로 시작하면 아직 같은 목록일 수 있다.
      const mayContinue =
        !lines[cursor].isComplete &&
        (STRUCTURE_FIRST_CHAR.test(line) || indentOf(line) > indentOf(first));

      return mayContinue
        ? { endIndex: lines.length, complete: false }
        : { endIndex: cursor, complete: true };
    }

    cursor += 1;
  }

  return result(cursor);
};

export const segmentStreamingAnswer = (
  content: string,
  isDone: boolean,
): ChatStreamSegment[] => {
  const lines = splitLines(content, isDone);
  const segments: ChatStreamSegment[] = [];

  const pushText = (start: number, end: number) => {
    const last = segments.at(-1);

    if (last?.kind === "text" && last.end === start) {
      last.end = end;
    } else {
      segments.push({ kind: "text", start, end });
    }
  };

  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    // 덜 온 줄인데 목록·표·제목처럼 시작하면, 줄이 끝날 때까지 판단을 미룬다.
    if (!line.isComplete && STRUCTURE_FIRST_CHAR.test(line.text)) {
      segments.push({ kind: "hold", start: line.start, end: content.length });
      break;
    }

    if (line.isComplete && isLabelLine(line.text)) {
      const next = nextNonBlank(lines, index + 1);
      const nextLine = lines[next];

      // 제목 다음 줄이 아직 없으면 카드 제목인지 알 수 없다.
      if (
        !nextLine ||
        (!nextLine.isComplete && STRUCTURE_FIRST_CHAR.test(nextLine.text))
      ) {
        if (isDone) {
          pushText(line.start, content.length);
          break;
        }

        segments.push({ kind: "hold", start: line.start, end: content.length });
        break;
      }

      const isNoticeTitle =
        NOTICE_KEYWORDS.test(line.text) && !isLabelLine(nextLine.text);

      if (isStructureStart(nextLine.text) || isNoticeTitle) {
        const { endIndex, complete } = findBlockEnd(lines, next, isDone);

        segments.push({
          kind: "block",
          start: line.start,
          end: lines[endIndex - 1]?.end ?? content.length,
          complete,
        });
        index = endIndex;
        continue;
      }
    }

    if (line.isComplete && isStructureStart(line.text)) {
      const { endIndex, complete } = findBlockEnd(lines, index, isDone);

      segments.push({
        kind: "block",
        start: line.start,
        end: lines[endIndex - 1]?.end ?? content.length,
        complete,
      });
      index = endIndex;
      continue;
    }

    pushText(line.start, line.end);
    index += 1;
  }

  return segments;
};
