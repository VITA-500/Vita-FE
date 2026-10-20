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
/** 좌우 버튼으로 카드를 옮기는 시간(ms) */
const SCROLL_DURATION_MS = 460;

// 시작은 부드럽게 가속하고 끝에서는 자연스럽게 감속한다.
const easeInOutCubic = (progress: number) =>
  progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;

type ChatCardRailProps<T> = {
  items: readonly T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  /** 목록 전체의 접근성 이름 (예: "요금제 6개") */
  ariaLabel: string;
  /** 좌우 버튼 접근성 이름에 붙는 단위 (예: "요금제") */
  itemLabel: string;
  className?: string;
  /** 데스크톱(lg) 1줄 배치에서 카드 한 칸의 최소 폭 클래스. cn은 클래스 충돌을 합치지 않으므로 통째로 바꾼다. */
  itemMinWidthClassName?: string;
  /** 지도 핀·카드 선택처럼 외부에서 특정 카드를 보이게 맞춰야 할 때 쓴다. */
  focusedItemKey?: string;
  /** 같은 카드를 다시 눌러도 위치를 다시 맞출 수 있게 외부에서 증가시키는 값. */
  focusSignal?: number;
  onItemSelect?: (item: T, index: number) => void;
};

const getDotItems = (count: number, active: number) => {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index);

  const indexes = new Set([0, count - 1, active]);
  for (let offset = 1; offset <= 2; offset += 1) {
    indexes.add(active - offset);
    indexes.add(active + offset);
  }

  return [...indexes]
    .filter((index) => index >= 0 && index < count)
    .sort((a, b) => a - b);
};

/**
 * 채팅 답변 안의 카드 블록(매장·요금제) 공통 배치.
 *
 * - 모바일(sm 미만): 한 장씩 가로로 넘김
 * - 태블릿(sm ~ lg): 2개씩 2줄(그리드)
 * - 데스크톱(lg 이상): 1줄로 나열. 가로 스크롤(스크롤바·휠·트랙패드)은 막고,
 *   카드가 넘치면 양옆 좌우 버튼으로 한 장씩 옮긴다.
 */
export const ChatCardRail = <T,>({
  ariaLabel,
  className,
  getKey,
  itemLabel,
  itemMinWidthClassName = "lg:min-w-[240px]",
  items,
  focusedItemKey,
  focusSignal = 0,
  renderItem,
  onItemSelect,
}: ChatCardRailProps<T>) => {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const requestedIndexRef = useRef<number | null>(null);
  /** 마우스가 올라간 쪽 가장자리. 그쪽 화살표만 보여준다. */
  const [hoverSide, setHoverSide] = useState<"prev" | "next" | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

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
    // 끝까지 이동해도 실제로 맨 앞에 온 카드 기준으로 표시한다.
    // 한 화면에 여러 장이 보이는 경우 마지막 카드 점으로 건너뛰지 않는다.
    setActiveIndex((current) =>
      !isRail || step <= 0
        ? 0
        : (requestedIndexRef.current ??
          Math.min(Math.round(track.scrollLeft / step), items.length - 1) ??
          current),
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

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    },
    [],
  );

  /**
   * index번째 카드가 맨 앞에 오도록 옮긴다(끝 쪽 카드는 스크롤 끝에서 멈춘다).
   * scrollTo의 smooth는 OS 애니메이션 설정·overflow-hidden 트랙에서 즉시 이동하는 경우가 있어 직접 애니메이션한다.
   */
  const scrollToCard = useCallback(
    (index: number, align: "start" | "center" = "start") => {
      const track = trackRef.current;
      const step = getStep();
      const targetCard = track?.children[index] as HTMLElement | undefined;

      if (!track || !targetCard || step <= 0) return;

      requestedIndexRef.current = Math.max(
        0,
        Math.min(index, items.length - 1),
      );
      setActiveIndex(requestedIndexRef.current);

      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }

      const maxScroll = track.scrollWidth - track.clientWidth;
      const from = track.scrollLeft;
      const centeredLeft =
        targetCard.offsetLeft -
        (track.clientWidth - targetCard.offsetWidth) / 2;
      const targetLeft = align === "center" ? centeredLeft : index * step;
      const to = Math.min(Math.max(targetLeft, 0), maxScroll);
      const startedAt = performance.now();

      const animate = (time: number) => {
        const progress = Math.min((time - startedAt) / SCROLL_DURATION_MS, 1);

        track.scrollLeft = from + (to - from) * easeInOutCubic(progress);
        scrollFrameRef.current =
          progress < 1 ? requestAnimationFrame(animate) : null;
      };

      scrollFrameRef.current = requestAnimationFrame(animate);
    },
    [getStep, items.length],
  );

  /** 카드 한 장(카드 폭 + 간격)만큼 옮긴다. */
  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    const step = getStep();

    if (!track || step <= 0) return;

    scrollToCard(Math.round(track.scrollLeft / step) + direction);
  };

  const hasOverflow = canPrev || canNext;

  useEffect(() => {
    if (!focusedItemKey) return;

    const focusedIndex = items.findIndex(
      (item, index) => getKey(item, index) === focusedItemKey,
    );

    if (focusedIndex >= 0) {
      scrollToCard(focusedIndex, "center");
    }
  }, [focusedItemKey, focusSignal, getKey, items, scrollToCard]);

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
            "flex gap-3 overflow-x-auto",
            // 모바일은 데스크톱과 같은 가로 레일로 동작시켜 한 번에 한 카드만 보인다.
            // overflow-x-auto는 터치 스와이프를 지원하고, 데스크톱 레일은 기존 버튼 이동을 유지한다.
            "snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "lg:-m-1 lg:overflow-hidden lg:p-1",
          )}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, index) => (
            <li
              key={getKey(item, index)}
              className={cn(
                "flex min-w-0 shrink-0 basis-full snap-start sm:basis-[calc(50%-6px)] lg:flex-1",
                itemMinWidthClassName,
              )}
              onClick={() => {
                scrollToCard(index, "center");
                onItemSelect?.(item, index);
              }}
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
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {getDotItems(items.length, activeIndex).map(
            (index, position, visible) => {
              const item = items[index];
              const previous = visible[position - 1];
              const gap = previous === undefined ? 0 : index - previous;

              return (
                <span
                  key={`${getKey(item, index)}-dot-group`}
                  className="flex items-center gap-1.5"
                >
                  {gap > 1 && <span className="text-xs text-gray-400">…</span>}
                  <button
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
                </span>
              );
            },
          )}
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
        "absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition",
        "focus-visible:ring-brand/30 outline-none hover:bg-gray-50 hover:text-gray-950 focus-visible:ring-2",
        "dark:border-white/10 dark:bg-zinc-900 dark:text-gray-200 dark:hover:bg-zinc-800",
        "disabled:pointer-events-none disabled:opacity-0",
        isVisible
          ? "opacity-100"
          : "pointer-events-none opacity-0 focus-visible:opacity-100",
        // 카드 가장자리 클릭을 가로채지 않도록 화살표는 레일 바깥쪽에 둔다.
        direction === "prev" ? "-left-1" : "-right-1",
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};
