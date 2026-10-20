"use client";

import type { MouseEvent } from "react";
import { useState } from "react";
import type { RailTooltipProps } from "@/shared/ui/molecules/RailTooltip";

/** 사이드바 접힌 레일·헤더 버튼에 띄우는 툴팁 위치 */
export const useRailTooltip = (isSidebarOpen: boolean) => {
  const [tooltip, setTooltip] = useState<RailTooltipProps | null>(null);

  /** 접힌 레일 버튼 오른쪽. 사이드바가 펼쳐져 있으면 글자가 보여서 띄우지 않는다. */
  const showRailTooltip =
    (label: string, shortcut?: string) => (event: MouseEvent<HTMLElement>) => {
      if (isSidebarOpen) return;

      const rect = event.currentTarget.getBoundingClientRect();
      setTooltip({
        label,
        shortcut,
        y: rect.top + rect.height / 2,
      });
    };
  /** 헤더 버튼 아래 가운데 */
  const showHeaderTooltip =
    (label: string) => (event: MouseEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltip({
        label,
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
        placement: "bottom",
      });
    };

  return {
    tooltip,
    showRailTooltip,
    showHeaderTooltip,
    hideTooltip: () => setTooltip(null),
  };
};
