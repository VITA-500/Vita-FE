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

  it("shows the opened chat as the current chat and removes it from recent and pinned lists", () => {
    const { currentChat, pinnedChats, unpinnedRecentChats } =
      buildSidebarChatItems({
        activeSessionId: 2,
        currentChatTitle: "둘째 상담",
        chatSessions: [
          { sessionId: 1, title: "첫 상담", updatedAt: "2026-10-07T09:00:00" },
          {
            sessionId: 2,
            title: "둘째 상담",
            updatedAt: "2026-10-07T10:00:00",
          },
          {
            sessionId: 3,
            title: "셋째 상담",
            updatedAt: "2026-10-07T11:00:00",
          },
        ],
        pinnedSessionIds: [2, 1],
      });

    expect(currentChat).toMatchObject({
      active: true,
      key: "session-2",
      sessionId: 2,
      title: "둘째 상담",
    });
    expect(pinnedChats.map((chat) => chat.sessionId)).toEqual([1]);
    expect(unpinnedRecentChats.map((chat) => chat.sessionId)).toEqual([3]);
  });

  it("keeps the current chat while another chat is loading", () => {
    const { currentChat, unpinnedRecentChats } = buildSidebarChatItems({
      activeSessionId: 2,
      currentChatTitle: "둘째 상담",
      chatSessions: [
        { sessionId: 1, title: "첫 상담", updatedAt: "2026-10-07T09:00:00" },
        { sessionId: 2, title: "둘째 상담", updatedAt: "2026-10-07T10:00:00" },
      ],
      pendingSessionId: 1,
    });

    expect(currentChat).toMatchObject({ active: false, sessionId: 2 });
    expect(unpinnedRecentChats).toEqual([
      expect.objectContaining({ active: true, sessionId: 1 }),
    ]);
  });

  it("builds a current chat for guests without a server list", () => {
    const { currentChat, unpinnedRecentChats } = buildSidebarChatItems({
      activeSessionId: 9,
      currentChatTitle: "비회원 상담",
    });

    expect(currentChat).toMatchObject({ key: "session-9", sessionId: 9 });
    expect(unpinnedRecentChats).toEqual([]);
  });

  it("has no current chat before the first question", () => {
    expect(buildSidebarChatItems({ activeSessionId: null }).currentChat).toBe(
      null,
    );
  });

  it("masks personal information in sidebar titles", () => {
    const { currentChat, unpinnedRecentChats } = buildSidebarChatItems({
      activeSessionId: null,
      currentChatTitle: "010-1234-5678 개통 문의",
      chatSessions: [
        { sessionId: 1, title: null, updatedAt: "2026-10-07T09:00:00" },
      ],
      sessionTitles: { 1: "a.user@example.com 영수증" },
    });

    expect(currentChat?.title).toBe("010-****-5678 개통 문의");
    expect(unpinnedRecentChats[0]?.title).toBe("***@example.com 영수증");
  });
});
