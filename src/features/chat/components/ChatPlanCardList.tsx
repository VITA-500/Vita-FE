"use client";

import { ChatCardRail } from "@/features/chat/components/ChatCardRail";
import type { ChatPlanCard } from "@/features/chat/lib/chatPlanCards";
import { PlanCard } from "@/shared/ui/PlanCard";

type ChatPlanCardListProps = {
  plans: readonly ChatPlanCard[];
  className?: string;
};

/**
 * 채팅 답변 안의 요금제 카드 목록.
 *
 * 배치는 ChatCardRail을 따른다(모바일 1개씩 · 중간 폭 2개씩 2줄 · 데스크톱 4개씩 1줄 + 좌우 버튼).
 */
export const ChatPlanCardList = ({
  className,
  plans,
}: ChatPlanCardListProps) => (
  <ChatCardRail
    className={className}
    items={plans}
    ariaLabel={`요금제 ${plans.length}개`}
    itemLabel="요금제"
    getKey={(plan, index) => `${plan.planName}-${index}`}
    renderItem={(plan) => <PlanCard {...plan} className="h-full w-full!" />}
  />
);
