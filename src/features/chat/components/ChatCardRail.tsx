"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/shared/lib/cn";

/** 이 폭(px)만큼 좌우 가장자리에 마우스가 들어오면 그쪽 화살표를 보여준다. */
const ARROW_HOVER_ZONE_PX = 80;

type ChatCardRailProps<T> = {
  items: readonly T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** 목록 전체의 접근성 이름 (예: "요금제 6개") */
  ariaLabel: string;
  /** 좌우 버튼 접근성 이름에 붙는 단위 (예: "요금제") */
  itemLabel: string;
  className?: string;
};

/**
 * 채팅 답변 안의 카드 블록(매장·요금제) 공통 배치.
 *
 * - 모바일(sm 미만): 1개씩 세로로
 * - 태블릿(sm ~ lg): 2개씩 2줄(그리드)
 * - 데스크톱(lg 이상): 1줄로 나열. 가로 스크롤(스크롤바·휠·트랙패드)은 막고,
 *   카드가 넘치면 양옆 좌우 버튼으로 한 장씩 옮긴다.
 */
export const ChatCardRail = <T,>({
  ariaLabel,
  className,
  getKey,
  itemLabel,
  items,
  renderItem,
}: ChatCardRailProps<T>) => {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  /** 마우스가 올라간 쪽 가장자리. 그쪽 화살표만 보여준다. */
  const [hoverSide, setHoverSide] = useState<"prev" | "next" | null>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;

    setHoverSide(
      x < ARROW_HOVER_ZONE_PX
        ? "prev"
        : x > rect.width - ARROW_HOVER_ZONE_PX
          ? "next"
          : null,
    );
  };

  /** 첫 카드 기준 한 칸(카드 폭 + 간격) 너비 */
  const getStep = useCallback(() => {
    const track = trackRef.current;
    const first = track?.children[0] as HTMLElement | undefined;
    const second = track?.children[1] as HTMLElement | undefined;

    if (!first) return 0;

    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
  }, []);

  const updateButtons = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const isRail = getComputedStyle(track).display === "flex";
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (!isRail) {
      track.scrollLeft = 0;
    }

    const isAtEnd = track.scrollLeft >= maxScroll - 1;
    const step = getStep();

    setCanPrev(isRail && track.scrollLeft > 1);
    setCanNext(isRail && !isAtEnd);
    // 맨 끝까지 오면 마지막 점을 켠다(끝에서는 마지막 카드까지 다 보이므로).
    setActiveIndex(
      !isRail || step <= 0
        ? 0
        : isAtEnd
          ? items.length - 1
          : Math.min(Math.round(track.scrollLeft / step), items.length - 1),
    );
  }, [getStep, items.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateButtons();
    const observer = new ResizeObserver(updateButtons);
    observer.observe(track);

    return () => observer.disconnect();
  }, [items.length, updateButtons]);

  /** index번째 카드가 맨 앞에 오도록 옮긴다(끝 쪽 카드는 스크롤 끝에서 멈춘다). */
  const scrollToCard = (index: number) => {
    const track = trackRef.current;
    const step = getStep();

    if (!track || step <= 0) return;

    track.scrollTo({ left: index * step, behavior: "smooth" });
  };

  /** 카드 한 장(카드 폭 + 간격)만큼 옮긴다. */
  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    const step = getStep();

    if (!track || step <= 0) return;

    scrollToCard(Math.round(track.scrollLeft / step) + direction);
  };

  const hasOverflow = canPrev || canNext;

  return (
    <div className={cn("min-w-0", className)}>
      <div
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverSide(null)}
      >
        <ul
          ref={trackRef}
          // 버튼 이동·키보드 포커스·scrollIntoView로 위치가 바뀌어도 버튼 상태를 맞춘다.
          onScroll={updateButtons}
          aria-label={ariaLabel}
          className={cn(
            "grid grid-cols-1 gap-3 sm:grid-cols-2",
            "lg:-m-1 lg:flex lg:overflow-hidden lg:p-1",
          )}
        >
          {items.map((item, index) => (
            <li
              key={getKey(item, index)}
              className="flex min-w-0 lg:min-w-[240px] lg:flex-1 lg:shrink-0"
            >
              {renderItem(item, index)}
            </li>
          ))}
        </ul>

        <RailButton
          direction="prev"
          disabled={!canPrev}
          isVisible={hoverSide === "prev"}
          label={`이전 ${itemLabel} 보기`}
          onClick={() => move(-1)}
        />
        <RailButton
          direction="next"
          disabled={!canNext}
          isVisible={hoverSide === "next"}
          label={`다음 ${itemLabel} 보기`}
          onClick={() => move(1)}
        />
      </div>

      {/* 데스크톱에서 카드가 넘칠 때: 현재 위치를 보여주고, 눌러서 해당 카드로 이동 */}
      {hasOverflow && (
        <div className="mt-2 hidden items-center justify-center gap-1.5 lg:flex">
          {items.map((item, index) => (
            <button
              key={`${getKey(item, index)}-dot`}
              type="button"
              onClick={() => scrollToCard(index)}
              aria-label={`${index + 1}번째 ${itemLabel} 보기`}
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

type RailButtonProps = {
  direction: "prev" | "next";
  disabled: boolean;
  /** 마우스가 이쪽 가장자리에 있을 때만 보인다(키보드 포커스 시에도 보임). */
  isVisible: boolean;
  label: string;
  onClick: () => void;
};

const RailButton = ({
  direction,
  disabled,
  isVisible,
  label,
  onClick,
}: RailButtonProps) => {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition lg:flex",
        "focus-visible:ring-brand/30 outline-none hover:bg-gray-50 hover:text-gray-950 focus-visible:ring-2",
        "dark:border-white/10 dark:bg-zinc-900 dark:text-gray-200 dark:hover:bg-zinc-800",
        "disabled:pointer-events-none disabled:opacity-0",
        isVisible
          ? "opacity-100"
          : "pointer-events-none opacity-0 focus-visible:opacity-100",
        // 카드 영역 안쪽에 둬서 부모의 overflow-hidden(매장 블록 등)에 잘리지 않게 한다.
        direction === "prev" ? "left-2" : "right-2",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};
