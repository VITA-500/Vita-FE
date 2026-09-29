import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { claimGuestChatSessions } from "./chatService";
import { guestChatStorage } from "./guestChatStorage";

const GUEST_ID = "3f2c8f1e-6a1b-4c1d-9e2f-0a1b2c3d4e5f";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("claimGuestChatSessions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("vita-guest-id", GUEST_ID);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("게스트 세션을 claim하고 보고 있던 세션을 회원 소유로 바꾼다", async () => {
    guestChatStorage.addPendingGuestSession(11);
    guestChatStorage.setActiveSession({ sessionId: 11, owner: "guest" });

    // fetch 시그니처로 타입을 잡아야 mock.calls에서 두 번째 인자(init)를 꺼낼 수 있다.
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);

      if (url.endsWith("/auth/csrf")) {
        return jsonResponse(200, { headerName: "X-XSRF-TOKEN", token: "t" });
      }

      return jsonResponse(200, {
        sessionId: 11,
        claimedAt: "2026-09-29T10:00:00",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await claimGuestChatSessions();

    expect(result.claimedSessionIds).toEqual([11]);
    expect(guestChatStorage.getPendingGuestSessionIds()).toEqual([]);
    expect(guestChatStorage.getActiveSession()).toEqual({
      sessionId: 11,
      owner: "member",
    });

    const claimCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/chat/sessions/11/claim"),
    );
    const init = claimCall?.[1];

    expect(init).toBeDefined();

    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["X-Guest-Id"]).toBe(
      GUEST_ID,
    );
    expect((init?.headers as Record<string, string>)["X-XSRF-TOKEN"]).toBe("t");
  });

  it("타인 세션(403)은 목록에서 빼고 active 세션도 정리한다", async () => {
    guestChatStorage.addPendingGuestSession(12);
    guestChatStorage.setActiveSession({ sessionId: 12, owner: "guest" });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith("/auth/csrf")
          ? jsonResponse(200, { headerName: "X-XSRF-TOKEN", token: "t" })
          : jsonResponse(403, { code: "FORBIDDEN", message: "forbidden" }),
      ),
    );

    const result = await claimGuestChatSessions();

    expect(result.claimedSessionIds).toEqual([]);
    expect(guestChatStorage.getPendingGuestSessionIds()).toEqual([]);
    expect(guestChatStorage.getActiveSession()).toBeNull();
  });

  it("401이면 목록을 남겨 두고 다음에 다시 시도한다", async () => {
    guestChatStorage.addPendingGuestSession(13);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith("/auth/csrf")
          ? jsonResponse(200, { headerName: "X-XSRF-TOKEN", token: "t" })
          : jsonResponse(401, { code: "UNAUTHORIZED", message: "login" }),
      ),
    );

    await claimGuestChatSessions();

    expect(guestChatStorage.getPendingGuestSessionIds()).toEqual([13]);
  });

  it("guestId가 없으면 요청하지 않는다", async () => {
    window.localStorage.clear();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await claimGuestChatSessions();

    expect(result.claimedSessionIds).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("guestChatStorage", () => {
  beforeEach(() => window.localStorage.clear());

  it("UUID 형식의 guestId를 만들고 재사용한다", () => {
    const first = guestChatStorage.getOrCreateGuestId();

    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(guestChatStorage.getOrCreateGuestId()).toBe(first);
  });

  it("형식이 깨진 active 세션은 무시한다", () => {
    window.localStorage.setItem(
      "vita-active-chat-session",
      '{"sessionId":"x"}',
    );

    expect(guestChatStorage.getActiveSession()).toBeNull();
  });
});
