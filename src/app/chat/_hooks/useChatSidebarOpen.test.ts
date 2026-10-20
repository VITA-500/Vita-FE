import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ChatMode } from "@/features/chat/types";
import { useChatSidebarOpen } from "./useChatSidebarOpen";

const viewport = vi.hoisted(() => ({ isDesktop: true }));

vi.mock("@/shared/hooks/useIsDesktopViewport", () => ({
  useIsDesktopViewport: () => viewport.isDesktop,
}));

describe("useChatSidebarOpen", () => {
  it("데스크톱은 채팅이면 펼치고, 매장 지도로 바로 들어오면 접은 상태로 시작한다", () => {
    viewport.isDesktop = true;

    expect(
      renderHook(() => useChatSidebarOpen("chat")).result.current.isOpen,
    ).toBe(true);
    expect(
      renderHook(() => useChatSidebarOpen("store")).result.current.isOpen,
    ).toBe(false);
  });

  it("모바일은 항상 닫힌 상태로 시작한다", () => {
    viewport.isDesktop = false;

    expect(
      renderHook(() => useChatSidebarOpen("chat")).result.current.isOpen,
    ).toBe(false);
  });

  it("다른 화면에서 매장 지도로 바뀌면 사이드바를 닫는다", () => {
    viewport.isDesktop = true;
    const { result, rerender } = renderHook(
      ({ mode }: { mode: ChatMode }) => useChatSidebarOpen(mode),
      { initialProps: { mode: "chat" as ChatMode } },
    );

    expect(result.current.isOpen).toBe(true);
    rerender({ mode: "store" });
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.setIsOpen(true));
    expect(result.current.isOpen).toBe(true);
  });
});
