import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/http";
import { getChatError } from "@/features/chat/conversation/lib/chatErrors";
import { ChatAnswerTimeoutError, requestGuestChatJson } from "@/entities/chat";
import { vi, afterEach } from "vitest";

afterEach(() => vi.unstubAllGlobals());
describe("chat errors", () => {
  it("keeps guest HTTP status, code and validation details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "VALIDATION_ERROR",
            message: "잘못된 요청",
            fieldErrors: [
              { field: "content", message: "질문 내용은 필수입니다." },
            ],
          }),
          { status: 400 },
        ),
      ),
    );
    await expect(
      requestGuestChatJson("/chat/sessions", "guest"),
    ).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      fieldErrors: [{ field: "content", message: "질문 내용은 필수입니다." }],
    });
  });
  it("distinguishes authentication expiry from forbidden and missing sessions", () => {
    expect(getChatError(new ApiError("", 401))).toMatchObject({
      status: "expired",
      resetSession: true,
    });
    expect(getChatError(new ApiError("", 403))).toMatchObject({
      status: "failed",
      resetSession: false,
    });
    expect(getChatError(new ApiError("", 404))).toMatchObject({
      status: "failed",
      resetSession: true,
    });
    expect(getChatError(new TypeError("network"))).toMatchObject({
      status: "failed",
      resetSession: false,
    });
  });
  it("separates server errors and timeouts from the generic failure", () => {
    expect(getChatError(new ApiError("", 503)).message).toBe(
      "서버에 일시적인 문제가 있어요. 잠시 후 다시 시도해 주세요.",
    );
    expect(getChatError(new ChatAnswerTimeoutError()).message).toBe(
      "답변이 너무 오래 걸려 기다리기를 멈췄어요. 다시 시도해 주세요.",
    );
    expect(
      getChatError(new DOMException("Aborted", "AbortError")).message,
    ).toBe("답변이 너무 오래 걸려 기다리기를 멈췄어요. 다시 시도해 주세요.");
    expect(getChatError(new TypeError("network")).message).toBe(
      "답변을 받지 못했어요. 잠시 후 다시 시도해 주세요.",
    );
  });
});
