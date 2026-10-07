import { describe, expect, it } from "vitest";
import {
  buildSidebarChatItems,
  formatSessionTitle,
} from "@/features/chat/lib/chatSidebarItems";

describe("chatSidebarItems", () => {
  it("formats fallback titles from the updated date", () => {
    expect(
      formatSessionTitle({
        sessionId: 7,
        title: null,
        updatedAt: "2026-10-07T09:05:00",
      }),
    ).toBe("10월 7일 09:05 상담");
  });

  it("uses a session id fallback when the date is invalid", () => {
    expect(
      formatSessionTitle({
        sessionId: 7,
        title: null,
        updatedAt: "invalid",
      }),
    ).toBe("상담 #7");
  });

  it("keeps pinned chats separate from recent chats by session id", () => {
    const { pinnedChats, unpinnedRecentChats } = buildSidebarChatItems({
      activeSessionId: 2,
      chatSessions: [
        { sessionId: 1, title: "첫 상담", updatedAt: "2026-10-07T09:00:00" },
        { sessionId: 2, title: "둘째 상담", updatedAt: "2026-10-07T10:00:00" },
      ],
      pinnedSessionIds: [1],
    });

    expect(pinnedChats.map((chat) => chat.sessionId)).toEqual([1]);
    expect(unpinnedRecentChats.map((chat) => chat.sessionId)).toEqual([2]);
  });

  it("prepends the current unsaved chat when it is not in the server list", () => {
    const { visibleRecentChats } = buildSidebarChatItems({
      activeSessionId: null,
      currentChatTitle: "방금 시작한 상담",
      chatSessions: [
        { sessionId: 1, title: "이전 상담", updatedAt: "2026-10-07T09:00:00" },
      ],
    });

    expect(visibleRecentChats[0]).toMatchObject({
      active: true,
      key: "current-new",
      sessionId: null,
      title: "방금 시작한 상담",
    });
  });
});
