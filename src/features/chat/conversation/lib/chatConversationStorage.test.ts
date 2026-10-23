import { afterEach, describe, expect, it, vi } from "vitest";

import { chatConversationStorage } from "./chatConversationStorage";

describe("chatConversationStorage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("does not throw when guest storage exceeds its quota", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });

    expect(() =>
      chatConversationStorage.save("guest", {
        title: "게스트 상담",
        messages: [],
      }),
    ).not.toThrow();
  });

  it("does not throw when account-specific storage is unavailable", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    expect(() =>
      chatConversationStorage.save("user:1", {
        title: "회원 상담",
        messages: [],
      }),
    ).not.toThrow();
  });
});
