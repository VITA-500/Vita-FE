import { describe, expect, it } from "vitest";
import {
  maskSensitiveText,
  toSafeTitleText,
} from "@/features/chat/lib/chatTitleMask";

describe("chatTitleMask", () => {
  it("masks the middle digits of phone numbers", () => {
    expect(maskSensitiveText("010-1234-5678 번호로 개통 가능?")).toBe(
      "010-****-5678 번호로 개통 가능?",
    );
    expect(maskSensitiveText("01012345678 해지")).toBe("010-****-5678 해지");
    expect(maskSensitiveText("02-123-4567 매장")).toBe("02-****-4567 매장");
  });

  it("masks email local parts", () => {
    expect(maskSensitiveText("vita.user@example.com 으로 영수증")).toBe(
      "***@example.com 으로 영수증",
    );
  });

  it("masks resident numbers and long card or account numbers", () => {
    expect(maskSensitiveText("900101-1234567 본인확인")).toBe(
      "******-******* 본인확인",
    );
    expect(maskSensitiveText("카드 1234 5678 9012 3456 결제")).toBe(
      "카드 ************3456 결제",
    );
  });

  it("keeps ordinary prices and plan names", () => {
    expect(maskSensitiveText("5G 프리미어 85,000원 요금제")).toBe(
      "5G 프리미어 85,000원 요금제",
    );
  });

  it("collapses whitespace for titles", () => {
    expect(toSafeTitleText("  요금제\n\n변경   문의 ")).toBe(
      "요금제 변경 문의",
    );
  });
});
