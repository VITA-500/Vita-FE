import { describe, expect, it } from "vitest";
import { parseChatMarkdown } from "@/features/chat/components/ChatMarkdown";
import { groupAnswerCards } from "@/features/chat/lib/chatAnswerCards";

const unitsOf = (markdown: string) =>
  groupAnswerCards(parseChatMarkdown(markdown));

describe("groupAnswerCards", () => {
  it("turns a titled numbered list into step guide", () => {
    const units = unitsOf(
      [
        "### 유심 재발급 절차",
        "1. **본인 확인**: 신분증으로 본인 확인을 해요.",
        "2. **매장 방문**",
        "   - 가까운 매장에서 재발급을 신청해요.",
      ].join("\n"),
    );

    expect(units).toEqual([
      {
        type: "steps",
        title: "유심 재발급 절차",
        steps: [
          { title: "본인 확인", description: ["신분증으로 본인 확인을 해요."] },
          {
            title: "매장 방문",
            description: ["가까운 매장에서 재발급을 신청해요."],
          },
        ],
      },
    ]);
  });

  it("turns a preparation list into checklist", () => {
    const units = unitsOf("**필요한 준비물**\n- 신분증\n- 기존 유심");

    expect(units).toEqual([
      {
        type: "checklist",
        title: "필요한 준비물",
        items: [
          { text: "신분증", children: [] },
          { text: "기존 유심", children: [] },
        ],
      },
    ]);
  });

  it("wraps caution sections and ※ notes in a notice", () => {
    const units = unitsOf(
      "## 유의사항\n- 약정 중이면 위약금이 생길 수 있어요.\n\n※ 매장 운영 시간을 확인해 주세요.",
    );

    expect(units.map((unit) => unit.type)).toEqual(["notice", "notice"]);
    expect(units[0]).toMatchObject({ type: "notice", title: "유의사항" });
  });

  it("keeps an intro sentence ending with a colon visible", () => {
    const units = unitsOf(
      "아래 순서로 진행해 주세요:\n1. 앱 실행\n2. 메뉴 선택",
    );

    expect(units.map((unit) => unit.type)).toEqual(["block", "steps"]);
  });

  it("keeps comparison or untitled numbered lists as plain lists", () => {
    expect(
      unitsOf(
        "### USIM과 eSIM의 차이\n1. 형태가 달라요.\n2. 개통 방법이 달라요.",
      ).map((unit) => unit.type),
    ).toEqual(["block", "block"]);
    expect(
      unitsOf("1. 데이터를 많이 써요.\n2. 통화를 자주 해요.").map(
        (unit) => unit.type,
      ),
    ).toEqual(["block"]);
  });

  it("uses an intro sentence right before a numbered list", () => {
    expect(
      unitsOf(
        "아래 순서대로 진행해 주세요.\n\n1. 분실 신고\n2. 유심 재발급",
      ).map((unit) => unit.type),
    ).toEqual(["block", "steps"]);
  });

  it("leaves plan lists and plain content alone", () => {
    const units = unitsOf(
      "추천 요금제예요.\n\n1. **비타 라이트 5** (월 25,000원)\n2. **비타 라이트 10** (월 31,000원)",
    );

    expect(units.map((unit) => unit.type)).toEqual(["block", "block"]);
  });
});
