"use client";

import {
  BadgePercent,
  MapPin,
  MessageSquareText,
  Smartphone,
} from "lucide-react";

export type ChatQuickAction = {
  description: string;
  icon: typeof MessageSquareText;
  label: string;
  prompt: string;
};

export const chatQuickActions: ChatQuickAction[] = [
  {
    label: "요금제 변경",
    description: "절차와 확인할 조건을 물어봅니다.",
    prompt: "요금제를 변경하고 싶어요. 어떤 절차와 유의사항이 있나요?",
    icon: Smartphone,
  },
  {
    label: "근처 매장",
    description: "현재 위치 기준 매장을 찾습니다.",
    prompt: "지금 근처 매장을 찾아줘.",
    icon: MapPin,
  },
  {
    label: "제휴 혜택",
    description: "이용 가능한 제휴 혜택을 확인합니다.",
    prompt: "제휴 혜택을 확인하고 싶어요. 어떤 혜택을 볼 수 있나요?",
    icon: BadgePercent,
  },
  {
    label: "상담 정리",
    description: "지금 필요한 정보를 정리해 달라고 요청합니다.",
    prompt: "내 상황에 맞게 확인해야 할 통신 상담 항목을 정리해줘.",
    icon: MessageSquareText,
  },
];

type ChatQuickActionMenuProps = {
  onSelectAction: (prompt: string) => void;
};

export const ChatQuickActionMenu = ({
  onSelectAction,
}: ChatQuickActionMenuProps) => (
  <div className="absolute bottom-[calc(100%+10px)] left-0 z-30 w-[300px] rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-900">
    {chatQuickActions.map((action) => {
      const Icon = action.icon;

      return (
        <button
          key={action.label}
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
