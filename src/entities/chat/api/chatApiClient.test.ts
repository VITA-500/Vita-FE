import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/http";
import { createChatApiUrl, requestGuestChatJson } from "./chatApiClient";

describe("guest chat HTTP contract", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("preserves absolute URLs and sends guest identity without cookies", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"sessionId":7}'));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      requestGuestChatJson("https://api.vita.test/chat", "guest-key"),
    ).resolves.toEqual({ sessionId: 7 });
    expect(createChatApiUrl("https://api.vita.test/chat")).toBe(
      "https://api.vita.test/chat",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.vita.test/chat",
      expect.objectContaining({
        credentials: "omit",
        headers: expect.objectContaining({ "X-Guest-Id": "guest-key" }),
      }),
    );
  });

  it.each([204, 200])(
    "accepts an empty success response (%s)",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(null, { status })),
      );
      await expect(
        requestGuestChatJson("/chat", "guest-key"),
      ).resolves.toBeUndefined();
    },
  );

  it("preserves guest error details and its distinct non-JSON fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "expired",
            code: "EXPIRED",
            fieldErrors: [{ field: "content", message: "required" }],
          }),
          { status: 401 },
        ),
      ),
    );
    await expect(
      requestGuestChatJson("/chat", "guest-key"),
    ).rejects.toMatchObject({
      name: "ApiError",
      message: "expired",
      code: "EXPIRED",
      status: 401,
      fieldErrors: [{ field: "content", message: "required" }],
    } satisfies Partial<ApiError>);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })),
    );
    await expect(
      requestGuestChatJson("/chat", "guest-key"),
    ).rejects.toMatchObject({
      message: "Chat API failed: 503",
      status: 503,
    });
  });
});
