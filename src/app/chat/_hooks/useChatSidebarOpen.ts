"use client";

import { useState } from "react";
import type { ChatMode } from "@/features/chat/types";
import { useIsDesktopViewport } from "@/shared/hooks/useIsDesktopViewport";

/**
 * 사이드바 열림 상태. 데스크톱·모바일을 따로 둔다.
 * - 데스크톱: 매장 지도(?mode=store)로 바로 들어오면 닫은(접은) 상태, 그 외에는 펼친 상태로 시작한다.
 * - 모바일: 사이드바가 화면을 덮는 서랍이라 항상 닫힌 상태로 시작하고, 좌측 상단 버튼으로 연다.
 * - 채팅 등 다른 화면에서 매장 지도로 전환될 때도 지도를 넓게 보도록 사이드바를 닫는다.
 */
export const useChatSidebarOpen = (activeMode: ChatMode) => {
  const isDesktop = useIsDesktopViewport();
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(
    () => activeMode !== "store",
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isOpen = isDesktop ? isDesktopSidebarOpen : isMobileSidebarOpen;
  const setIsOpen = (nextIsOpen: boolean) => {
    if (isDesktop) {
      setIsDesktopSidebarOpen(nextIsOpen);
      return;
    }

    setIsMobileSidebarOpen(nextIsOpen);
  };

  // 이전 렌더의 화면 모드를 기억해, 매장 지도로 바뀐 순간에만 닫는다.
  const [modeSnapshot, setModeSnapshot] = useState(activeMode);

  if (modeSnapshot !== activeMode) {
    setModeSnapshot(activeMode);

    if (activeMode === "store") {
      setIsOpen(false);
    }
  }

  return { isOpen, setIsOpen };
};
