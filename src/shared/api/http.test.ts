import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, requestJson } from "./http";

describe("requestJson", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses the configured base URL and includes credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    globalThis.fetch = fetchMock;

    await expect(
      requestJson("/users/me", { baseUrl: "https://api.vita.test" }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.vita.test/users/me",
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("throws ApiError with the server message for failed responses", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "로그인이 필요합니다." }), {
        status: 401,
      }),
    );

    await expect(requestJson("/users/me")).rejects.toMatchObject({
      message: "로그인이 필요합니다.",
      status: 401,
    } satisfies Partial<ApiError>);
  });

  it("returns undefined for empty successful responses", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));

    await expect(requestJson("/auth/logout")).resolves.toBeUndefined();
  });
});
