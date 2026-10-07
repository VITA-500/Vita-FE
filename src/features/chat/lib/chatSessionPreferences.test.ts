import { beforeEach, describe, expect, it } from "vitest";
import {
  chatSessionPreferencesStore,
  markSessionDeleted,
  togglePinnedSession,
} from "./chatSessionPreferences";

describe("chatSessionPreferences", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("toggles pinned sessions in pinned order", () => {
    const pinned = togglePinnedSession(
      togglePinnedSession({ pinnedSessionIds: [], deletedSessionIds: [] }, 3),
      1,
    );

    expect(pinned.pinnedSessionIds).toEqual([3, 1]);
    expect(togglePinnedSession(pinned, 3).pinnedSessionIds).toEqual([1]);
  });

  it("unpins a session when it is deleted", () => {
    const next = markSessionDeleted(
      { pinnedSessionIds: [2, 5], deletedSessionIds: [] },
      2,
    );

    expect(next).toEqual({ pinnedSessionIds: [5], deletedSessionIds: [2] });
  });

  it("stores preferences per user and keeps the same snapshot object", () => {
    chatSessionPreferencesStore.update(7, (current) =>
      togglePinnedSession(current, 10),
    );

    const first = chatSessionPreferencesStore.get(7);

    expect(first.pinnedSessionIds).toEqual([10]);
    expect(chatSessionPreferencesStore.get(7)).toBe(first);
    expect(chatSessionPreferencesStore.get(8).pinnedSessionIds).toEqual([]);
  });

  it("ignores broken stored values", () => {
    window.localStorage.setItem(
      "vita-chat-session-preferences:user:1",
      '{"pinnedSessionIds":["a",4,4],"deletedSessionIds":null}',
    );

    expect(chatSessionPreferencesStore.get(1)).toEqual({
      pinnedSessionIds: [4],
      deletedSessionIds: [],
    });
  });
});
