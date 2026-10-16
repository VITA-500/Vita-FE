export type ChatMarkdownListItem = {
  text: string;
  /** 한 단계 들여쓴 하위 목록 항목 */
  children: string[];
};

export type ChatMarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; lines: string[] }
  | {
      type: "list";
      ordered: boolean;
      start: number;
      items: ChatMarkdownListItem[];
    }
  | { type: "quote"; lines: string[] }
  | { type: "code"; text: string }
  | { type: "rule" }
  | { type: "table"; header: string[]; rows: string[][] };

const HEADING = /^(#{1,6})\s+(.*)$/;
const UNORDERED_ITEM = /^\s*[-*+]\s+(.*)$/;
const ORDERED_ITEM = /^\s*(\d+)[.)]\s+(.*)$/;
const QUOTE = /^\s*>\s?(.*)$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const FENCE = /^\s*```/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_DIVIDER = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

const splitTableRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const isBlockStart = (line: string, nextLine?: string) =>
  HEADING.test(line) ||
  UNORDERED_ITEM.test(line) ||
  ORDERED_ITEM.test(line) ||
  QUOTE.test(line) ||
  RULE.test(line) ||
  FENCE.test(line) ||
  (TABLE_ROW.test(line) &&
    nextLine !== undefined &&
    TABLE_DIVIDER.test(nextLine));

const indentOf = (line: string) => line.match(/^\s*/)?.[0].length ?? 0;

export const parseChatMarkdown = (content: string): ChatMarkdownBlock[] => {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ChatMarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === "") {
      index += 1;
      continue;
    }

    if (FENCE.test(line)) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !FENCE.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1; // 닫는 ``` (없으면 끝까지 코드로 본다)
      blocks.push({ type: "code", text: codeLines.join("\n") });
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2].replace(/\s*#+\s*$/, ""),
      });
      index += 1;
      continue;
    }

    if (RULE.test(line)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    if (TABLE_ROW.test(line) && TABLE_DIVIDER.test(lines[index + 1] ?? "")) {
      const header = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && TABLE_ROW.test(lines[index])) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    if (QUOTE.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && QUOTE.test(lines[index])) {
        quoteLines.push(lines[index].match(QUOTE)?.[1] ?? "");
        index += 1;
      }
      blocks.push({ type: "quote", lines: quoteLines });
      continue;
    }

    const unordered = line.match(UNORDERED_ITEM);
    const ordered = line.match(ORDERED_ITEM);
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      const pattern = isOrdered ? ORDERED_ITEM : UNORDERED_ITEM;
      const items: ChatMarkdownListItem[] = [];
      // 목록 첫 줄의 들여쓰기를 기준으로, 그보다 2칸 이상 더 들여쓴 줄만 하위 항목으로 본다.
      // (LLM이 목록 전체를 들여써서 보내는 경우가 있어 0칸 기준으로 보면 첫 항목을 놓친다)
      const baseIndent = indentOf(line);
      const isNested = (target: string) =>
        /\S/.test(target) && indentOf(target) >= baseIndent + 2;

      while (index < lines.length) {
        const current = lines[index];
        const lastItem = items[items.length - 1];

        // 항목 사이에 빈 줄이 있어도(LLM이 자주 그렇게 쓴다) 다음 줄이 같은 목록이면 이어서 읽는다.
        if (current.trim() === "") {
          let nextIndex = index + 1;
          while (nextIndex < lines.length && lines[nextIndex].trim() === "") {
            nextIndex += 1;
          }
          const nextLine = lines[nextIndex];
          const continuesList =
            nextLine !== undefined &&
            ((isNested(nextLine) && Boolean(lastItem)) ||
              (pattern.test(nextLine) && !isNested(nextLine)));

          if (!continuesList) break;
          index = nextIndex;
          continue;
        }

        const isIndented = isNested(current);

        // 들여쓴 목록 줄은 바로 위 항목의 하위 목록으로 붙인다(한 단계까지).
        if (isIndented && lastItem) {
          const child =
            current.match(UNORDERED_ITEM) ?? current.match(ORDERED_ITEM);

          if (child) {
            lastItem.children.push(child[child.length - 1]);
            index += 1;
            continue;
          }

          // 들여쓴 일반 문장은 같은 항목(또는 마지막 하위 항목)의 이어지는 줄이다.
          if (!isBlockStart(current)) {
            if (lastItem.children.length > 0) {
              lastItem.children[lastItem.children.length - 1] +=
                `\n${current.trim()}`;
            } else {
              lastItem.text += `\n${current.trim()}`;
            }
            index += 1;
            continue;
          }
        }

        const match = current.match(pattern);

        if (match && !isIndented) {
          items.push({ text: isOrdered ? match[2] : match[1], children: [] });
          index += 1;
          continue;
        }

        break;
      }

      // 목록으로 읽힌 항목이 없으면(예상 밖의 모양) 무한 반복을 막기 위해 문단으로 넘긴다.
      if (items.length === 0) {
        blocks.push({ type: "paragraph", lines: [line] });
        index += 1;
        continue;
      }

      blocks.push({
        type: "list",
        ordered: isOrdered,
        start: ordered ? Number(ordered[1]) : 1,
        items,
      });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !isBlockStart(lines[index], lines[index + 1])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    // 어떤 블록 규칙에도 맞지 않아 한 줄도 못 읽었으면, 그 줄을 문단으로 처리해 반드시 다음 줄로 넘어간다.
    if (paragraphLines.length === 0) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraphLines });
  }

  return blocks;
};
