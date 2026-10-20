import { describe, expect, it } from "vitest";
import { findClarifyChoices } from "@/features/chat/message/lib/chatClarifyChoices";

const visitPurposeAnswer = [
  "어떤 목적으로 매장을 방문하실 예정인지 알려주시면 필요한 준비물을 안내드릴게요! 😊",
  "예를 들어 아래와 같은 경우에 대해 안내드릴 수 있습니다.",
  "",
  "* 기기변경",
  "* 해지",
  "* **명의변경**",
  "* 기타 문의",
  "",
  "궁금하신 내용을 말씀해 주세요!",
].join("\n");

describe("findClarifyChoices", () => {
  it("되묻는 문장 옆의 짧은 목록을 선택지로 찾는다", () => {
    const clarify = findClarifyChoices(visitPurposeAnswer);

    expect(clarify?.choices).toEqual(["기기변경", "해지", "명의변경"]);
    // "기타 문의"는 고르기만으로 답할 수 없어 버튼 대신 직접 입력을 안내한다.
    expect(clarify?.hasOtherOption).toBe(true);
    expect(clarify?.contentWithoutChoices).not.toContain("기기변경");
    expect(clarify?.contentWithoutChoices).toContain(
      "궁금하신 내용을 말씀해 주세요!",
    );
  });

  it("되묻는 문장이 없는 일반 목록은 선택지로 보지 않는다", () => {
    expect(
      findClarifyChoices(
        [
          "준비물은 다음과 같아요.",
          "",
          "- 신분증",
          "- 기존 기기",
          "- 유심",
        ].join("\n"),
      ),
    ).toBeNull();
  });

  it("설명이 붙은 긴 항목이나 콜론이 있는 항목은 선택지로 보지 않는다", () => {
    expect(
      findClarifyChoices(
        [
          "어떤 요금제를 원하시는지 알려주시면 안내드릴게요.",
          "- 5G 프리미어: 데이터 무제한에 부가 혜택이 많아요",
          "- 5G 스탠다드: 월 요금이 낮아요",
        ].join("\n"),
      ),
    ).toBeNull();
    expect(
      findClarifyChoices(
        [
          "아래 중 어떤 경우인지 말씀해 주세요.",
          "- 해외에서 데이터를 많이 쓰는 여행을 하실 예정인 경우",
          "- 국내에서만 쓰는 경우",
        ].join("\n"),
      ),
    ).toBeNull();
  });

  it("선택지가 하나뿐이거나 기타만 남으면 버튼을 만들지 않는다", () => {
    expect(
      findClarifyChoices(
        ["어떤 내용인지 말씀해 주세요.", "- 기기변경", "- 기타 문의"].join(
          "\n",
        ),
      ),
    ).toBeNull();
  });
});
