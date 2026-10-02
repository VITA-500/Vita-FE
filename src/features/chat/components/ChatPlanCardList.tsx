"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatPlanCard } from "@/features/chat/lib/chatPlanCards";
import { cn } from "@/shared/lib/cn";
import { PlanCard } from "@/shared/ui/PlanCard";

type ChatPlanCardListProps = {
  plans: readonly ChatPlanCard[];
  className?: string;
};

const CARD_GAP_PX = 12;

/**
 * 채팅 답변 안의 요금제 카드 목록.
 *
 * 카드를 가로로 나열하고(PlanCardGroup과 같은 배치) 스크롤바만 숨긴다.
 * 모바일에서는 손가락으로 한 장씩 넘기고(카드 단위로 멈춤), 카드가 말풍선 폭을 넘칠 때는
 * 아래 점으로 현재 위치를 보여주고 눌러서 이동할 수 있다(스크롤바가 없는 데스크톱 마우스 사용자용).
 */
export const ChatPlanCardList = ({
  className,
  plans,
}: ChatPlanCardListProps) => {
  const trackRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateOverflow = () =>
      setIsOverflowing(track.scrollWidth > track.clientWidth + 1);

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(track);

    return () => observer.disconnect();
  }, [plans.length]);

  const handleScroll = () => {
    const track = trackRef.current;
    const firstCard = track?.firstElementChild as HTMLElement | null;

    if (!track || !firstCard) return;

    const isAtEnd =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    const nextIndex = isAtEnd
      ? plans.length - 1
      : Math.round(track.scrollLeft / (firstCard.offsetWidth + CARD_GAP_PX));

    setActiveIndex(Math.min(Math.max(nextIndex, 0), plans.length - 1));
  };

  const scrollToCard = (index: number) => {
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;

    if (!track || !card) return;

    track.scrollTo({
      left: card.offsetLeft - track.offsetLeft,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("min-w-0", className)}>
      <ul
        ref={trackRef}
        onScroll={handleScroll}
        aria-label={`요금제 ${plans.length}개`}
        className="-mx-1 flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto scroll-smooth px-1 py-1"
      >
        {plans.map((plan, index) => (
          <li
            key={`${plan.planName}-${index}`}
            className={cn(
              "flex shrink-0 snap-start",
              // 모바일: 말풍선 폭에 맞춰 카드를 키우고, 다음 카드가 살짝 보이게 해서 넘길 수 있음을 알린다.
              plans.length === 1
                ? "max-md:w-full"
                : "max-md:w-[calc(100%-2.5rem)]",
            )}
          >
            <PlanCard {...plan} className="max-md:w-full!" />
          </li>
        ))}
      </ul>

      {isOverflowing && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {plans.map((plan, index) => (
            <button
              key={`${plan.planName}-dot-${index}`}
              type="button"
              onClick={() => scrollToCard(index)}
              aria-label={`${index + 1}번째 요금제(${plan.planName}) 보기`}
              aria-current={index === activeIndex ? "true" : undefined}
              className="flex h-4 items-center px-0.5"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "bg-brand w-4"
                    : "w-1.5 bg-gray-300 dark:bg-white/20",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
