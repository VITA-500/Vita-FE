import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/http";
import { getChatError } from "./chatErrors";
import { requestGuestChatJson } from "@/entities/chat";
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
});
