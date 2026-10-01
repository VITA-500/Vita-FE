import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ChatMarkdown,
  parseChatMarkdown,
} from "@/features/chat/components/ChatMarkdown";

describe("parseChatMarkdown", () => {
  it("splits headings, lists, tables and paragraphs into blocks", () => {
    const blocks = parseChatMarkdown(
      [
        "## 요금제 변경 안내",
        "변경은 다음 달 1일부터 적용돼요.",
        "",
        "1. 마이페이지 접속",
        "2. 요금제 선택",
        "",
        "- 위약금 없음",
        "- 결합 할인 유지",
        "",
        "| 요금제 | 월 요금 |",
        "| --- | --- |",
        "| 5G 심플 | 55,000원 |",
      ].join("\n"),
    );

    expect(blocks.map((block) => block.type)).toEqual([
      "heading",
      "paragraph",
      "list",
      "list",
      "table",
    ]);
  });
});

describe("parseChatMarkdown - 들여쓴 목록", () => {
  it("reads lists indented as a whole without hanging", () => {
    const blocks = parseChatMarkdown(
      "요금제 목록이에요.\n  - 비타 라이트 5\n  - 비타 라이트 10",
    );

    expect(blocks.map((block) => block.type)).toEqual(["paragraph", "list"]);
    const list = blocks[1];
    expect(list.type === "list" && list.items.map((item) => item.text)).toEqual(
      ["비타 라이트 5", "비타 라이트 10"],
    );
  });
});

describe("ChatMarkdown", () => {
  it("renders markdown syntax instead of showing raw symbols", () => {
    const { container } = render(
      <ChatMarkdown
        content={"**유심 재발급**은 `신분증`이 필요해요.\n- 매장 방문"}
      />,
    );

    expect(screen.getByText("유심 재발급").tagName).toBe("STRONG");
    expect(screen.getByText("신분증").tagName).toBe("CODE");
    expect(container.querySelector("ul li")?.textContent).toBe("매장 방문");
    expect(container.textContent).not.toContain("**");
  });

  it("keeps HTML in answers as plain text", () => {
    const { container } = render(
      <ChatMarkdown content={'<img src=x onerror="alert(1)">'} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img");
  });

  it("does not render unsafe link protocols", () => {
    const { container } = render(
      <ChatMarkdown content={"[눌러보세요](javascript:alert(1))"} />,
    );

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("눌러보세요");
  });
});
