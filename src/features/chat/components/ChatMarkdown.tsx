import { Fragment, type ReactNode } from "react";
import { ChatPlanCardList } from "@/features/chat/components/ChatPlanCardList";
import {
  type ChatAnswerUnit,
  groupAnswerCards,
} from "@/features/chat/lib/chatAnswerCards";
import { blockToPlanCards } from "@/features/chat/lib/chatPlanCards";
import { ChecklistCard } from "@/shared/ui/ChecklistCard";
import { StepGuideCard } from "@/shared/ui/StepGuideCard";
import { WarningNotice } from "@/shared/ui/WarningNotice";

/**
 * 챗봇 답변(LLM이 만든 마크다운)을 말풍선 안에서 읽기 좋게 그려주는 가벼운 렌더러.
 *
 * - 지원: 제목(#), 굵게(**), 기울임(*), 인라인 코드(`), 링크([text](url)),
 *   글머리 목록(- * +), 번호 목록(1.), 인용(>), 구분선(---), 코드 블록(```), 표(| a | b |)
 * - HTML 문자열을 주입하지 않고 React 요소로만 만들기 때문에 답변에 섞인 태그는 그대로 글자로 보인다(XSS 방지).
 * - 링크는 http(s)와 앱 내부 경로(/)만 허용한다.
 */

type ChatMarkdownProps = {
  content: string;
  className?: string;
};

import {
  type ChatMarkdownBlock,
  type ChatMarkdownListItem,
  parseChatMarkdown,
} from "@/features/chat/lib/chatMarkdownParser";
export {
  type ChatMarkdownBlock,
  type ChatMarkdownListItem,
  parseChatMarkdown,
} from "@/features/chat/lib/chatMarkdownParser";

/* ------------------------------------------------------------------ */
/* 인라인                                                               */
/* ------------------------------------------------------------------ */

const INLINE_TOKEN =
  /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*)|(__[^_\n]+?__)|(\[[^\]\n]+\]\((?:[^()\s]|\([^()\s]*\))+\))|((?<![0-9A-Za-z*])\*[^*\s](?:[^*\n]*?[^*\s])?\*)/;

const isSafeHref = (href: string) =>
  /^https?:\/\//i.test(href) ||
  (href.startsWith("/") && !href.startsWith("//"));

const renderInline = (text: string, keyPrefix = "i"): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let rest = text;
  let count = 0;

  while (rest.length > 0) {
    const match = rest.match(INLINE_TOKEN);

    if (!match || match.index === undefined) {
      nodes.push(rest);
      break;
    }

    if (match.index > 0) {
      nodes.push(rest.slice(0, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${count}`;
    count += 1;

    if (match[1]) {
      nodes.push(
        <code
          key={key}
          className="bg-surface-muted rounded-md px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-white/10"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (match[2] || match[3]) {
      nodes.push(
        <strong
          key={key}
          className="text-text-primary font-bold dark:text-white"
        >
          {renderInline(token.slice(2, -2), key)}
        </strong>,
      );
    } else if (match[4]) {
      const linkMatch = token.match(
        /^\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)$/,
      );
      const label = linkMatch?.[1] ?? token;
      const href = linkMatch?.[2] ?? "";

      nodes.push(
        isSafeHref(href) ? (
          <a
            key={key}
            href={href}
            target={href.startsWith("/") ? undefined : "_blank"}
            rel={href.startsWith("/") ? undefined : "noopener noreferrer"}
            className="text-brand-hover dark:text-brand font-semibold underline underline-offset-2"
          >
            {renderInline(label, key)}
          </a>
        ) : (
          <Fragment key={key}>{label}</Fragment>
        ),
      );
    } else if (match[5]) {
      nodes.push(
        <em key={key} className="italic">
          {renderInline(token.slice(1, -1), key)}
        </em>,
      );
    }

    rest = rest.slice(match.index + token.length);
  }

  return nodes;
};

const renderLines = (lines: string[], keyPrefix: string) =>
  lines.map((line, index) => (
    <Fragment key={`${keyPrefix}-${index}`}>
      {index > 0 && <br />}
      {renderInline(line, `${keyPrefix}-${index}`)}
    </Fragment>
  ));

/* ------------------------------------------------------------------ */
/* 블록                                                                 */
/* ------------------------------------------------------------------ */

const renderBlock = (
  block: ChatMarkdownBlock,
  index: number | string,
): ReactNode => {
  const key = `b-${index}`;
  const planCards = blockToPlanCards(block);

  // 요금제 표·목록은 프론트의 요금제 카드로 바꿔 보여준다.
  if (planCards) {
    return <ChatPlanCardList key={key} plans={planCards} className="py-1" />;
  }

  switch (block.type) {
    case "heading":
      return (
        <p
          key={key}
          className={
            block.level <= 2
              ? "text-text-primary text-[15px] font-extrabold dark:text-white"
              : "text-text-primary font-bold dark:text-white"
          }
        >
          {renderInline(block.text, key)}
        </p>
      );
    case "paragraph":
      return <p key={key}>{renderLines(block.lines, key)}</p>;
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";

      return (
        <ListTag
          key={key}
          start={block.ordered && block.start !== 1 ? block.start : undefined}
          className={
            block.ordered
              ? "marker:text-text-secondary list-decimal space-y-1 pl-5 marker:font-bold"
              : "marker:text-brand list-disc space-y-1 pl-5"
          }
        >
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`} className="pl-0.5">
              {renderLines(item.text.split("\n"), `${key}-${itemIndex}`)}
              {item.children.length > 0 && (
                <ul className="marker:text-text-secondary mt-1 list-[circle] space-y-0.5 pl-5">
                  {item.children.map((child, childIndex) => (
                    <li key={`${key}-${itemIndex}-${childIndex}`}>
                      {renderLines(
                        child.split("\n"),
                        `${key}-${itemIndex}-${childIndex}`,
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ListTag>
      );
    }
    case "quote":
      return (
        <blockquote
          key={key}
          className="border-brand bg-brand-soft/60 dark:bg-brand/10 rounded-r-xl border-l-4 px-3 py-2"
        >
          {renderLines(block.lines, key)}
        </blockquote>
      );
    case "code":
      return (
        <pre
          key={key}
          className="bg-surface-muted overflow-x-auto rounded-xl px-3 py-2 font-mono text-xs leading-5 dark:bg-white/10"
        >
          <code>{block.text}</code>
        </pre>
      );
    case "rule":
      return (
        <hr key={key} className="border-border my-1 dark:border-white/10" />
      );
    case "table":
      return (
        <div
          key={key}
          className="border-border overflow-x-auto rounded-xl border dark:border-white/10"
        >
          <table className="w-full border-collapse text-left text-[13px] leading-5">
            <thead className="bg-surface-muted dark:bg-white/5">
              <tr>
                {block.header.map((cell, cellIndex) => (
                  <th
                    key={`${key}-h-${cellIndex}`}
                    scope="col"
                    className="text-text-primary px-3 py-2 font-bold whitespace-nowrap dark:text-white"
                  >
                    {renderInline(cell, `${key}-h-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr
                  key={`${key}-r-${rowIndex}`}
                  className="border-border border-t dark:border-white/10"
                >
                  {block.header.map((_, cellIndex) => (
                    <td
                      key={`${key}-r-${rowIndex}-${cellIndex}`}
                      className="px-3 py-2 align-top"
                    >
                      {renderInline(
                        row[cellIndex] ?? "",
                        `${key}-r-${rowIndex}-${cellIndex}`,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
};

/* ------------------------------------------------------------------ */
/* 안내 카드 (절차 · 준비물 · 주의사항)                                    */
/* ------------------------------------------------------------------ */

const renderUnit = (unit: ChatAnswerUnit, index: number): ReactNode => {
  const key = `u-${index}`;

  switch (unit.type) {
    case "block":
      return renderBlock(unit.block, index);
    case "steps":
      return (
        <StepGuideCard
          key={key}
          title={unit.title ? renderInline(unit.title, `${key}-t`) : undefined}
          steps={unit.steps.map((step, stepIndex) => ({
            title: renderInline(step.title, `${key}-${stepIndex}-t`),
            description:
              step.description.length > 0
                ? renderLines(step.description, `${key}-${stepIndex}-d`)
                : undefined,
          }))}
        />
      );
    case "checklist":
      return (
        <ChecklistCard
          key={key}
          title={unit.title ? renderInline(unit.title, `${key}-t`) : undefined}
          items={unit.items.map((item, itemIndex) => ({
            label: renderLines(
              [...item.text.split("\n"), ...item.children],
              `${key}-${itemIndex}`,
            ),
          }))}
        />
      );
    case "notice":
      return (
        <WarningNotice
          key={key}
          title={unit.title ? renderInline(unit.title, `${key}-t`) : undefined}
        >
          <div className="space-y-2">
            {unit.blocks.map((block, blockIndex) =>
              renderBlock(block, `${key}-${blockIndex}`),
            )}
          </div>
        </WarningNotice>
      );
  }
};

export const ChatMarkdown = ({ className, content }: ChatMarkdownProps) => (
  <div
    className={["space-y-3 break-words", className].filter(Boolean).join(" ")}
  >
    {groupAnswerCards(parseChatMarkdown(content)).map(renderUnit)}
  </div>
);
