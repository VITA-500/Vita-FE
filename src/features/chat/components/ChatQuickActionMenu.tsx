"use client";

import {
  BadgePercent,
  MapPin,
  MessageSquareText,
  Smartphone,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatQuickActionId } from "@/features/chat/lib/chatClientSettings";

export type ChatQuickAction = {
  description: string;
  icon: typeof MessageSquareText;
  /** BE에 빠른 액션 출처를 보낼 때 쓸 값(clientContext.actionId 후보). */
  id: ChatQuickActionId;
  label: string;
  prompt: string;
};

export const chatQuickActions: ChatQuickAction[] = [
  {
    id: "change_plan",
    label: "요금제 변경",
    description: "절차와 확인할 조건을 물어봅니다.",
    prompt: "요금제를 변경하고 싶어요. 어떤 절차와 유의사항이 있나요?",
    icon: Smartphone,
  },
  {
    id: "nearby_store",
    label: "근처 매장",
    description: "현재 위치 기준 매장을 찾습니다.",
    prompt: "지금 근처 매장을 찾아줘.",
    icon: MapPin,
  },
  {
    id: "partner_benefit",
    label: "제휴 혜택",
    description: "이용 가능한 제휴 혜택을 확인합니다.",
    prompt: "제휴 혜택을 확인하고 싶어요. 어떤 혜택을 볼 수 있나요?",
    icon: BadgePercent,
  },
  {
    id: "consult_summary",
    label: "상담 정리",
    description: "지금 필요한 정보를 정리해 달라고 요청합니다.",
    prompt: "내 상황에 맞게 확인해야 할 통신 상담 항목을 정리해줘.",
    icon: MessageSquareText,
  },
];

/** 설정에 저장된 순서대로, 보이게 한 빠른 액션만 고른다. */
export const getVisibleQuickActions = (
  actionIds: readonly ChatQuickActionId[],
) =>
  actionIds.flatMap((id) => {
    const action = chatQuickActions.find((item) => item.id === id);

    return action ? [action] : [];
  });

type ChatQuickActionMenuProps = {
  actions: readonly ChatQuickAction[];
  onSelectAction: (prompt: string) => void;
};

const MENU_MAX_HEIGHT = 360;
const MENU_VIEWPORT_GAP = 16;
const MENU_MIN_HEIGHT = 120;

export const ChatQuickActionMenu = ({
  actions,
  onSelectAction,
}: ChatQuickActionMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(MENU_MAX_HEIGHT);

  useEffect(() => {
    const updateMaxHeight = () => {
      const triggerRect =
        menuRef.current?.parentElement?.getBoundingClientRect();
      const availableHeight = triggerRect
        ? triggerRect.top - MENU_VIEWPORT_GAP
        : MENU_MAX_HEIGHT;

      setMaxHeight(
        Math.max(
          MENU_MIN_HEIGHT,
          Math.min(MENU_MAX_HEIGHT, Math.floor(availableHeight)),
        ),
      );
    };

    updateMaxHeight();
    window.addEventListener("resize", updateMaxHeight);
    return () => window.removeEventListener("resize", updateMaxHeight);
  }, []);

  return (
    <div
      ref={menuRef}
      className="absolute bottom-[calc(100%+10px)] left-0 z-30 w-[300px] max-w-[calc(100vw-32px)] overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900"
      style={{ maxHeight }}
    >
      {actions.length === 0 && (
        <p className="px-3 py-3 text-sm leading-6 font-medium text-gray-500 dark:text-gray-400">
          보이는 빠른 액션이 없어요. 설정에서 다시 켤 수 있어요.
        </p>
      )}
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onSelectAction(action.prompt)}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <span className="bg-brand-soft text-brand mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <Icon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-gray-950 dark:text-white">
                {action.label}
              </span>
              <span className="mt-0.5 block text-xs leading-5 font-medium text-gray-500 dark:text-gray-400">
                {action.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
