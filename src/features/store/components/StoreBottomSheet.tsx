"use client";

import { List } from "lucide-react";
import {
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/shared/lib/cn";

/** 손잡이를 이만큼(px) 넘게 끌어야 끌기로 본다. 그보다 짧으면 누르기(한 단계 닫기)로 본다. */
const DRAG_THRESHOLD_PX = 6;
/** 매장 정보 시트를 이만큼(px) 넘게 아래로 끌면 닫는다. */
const INFO_CLOSE_DRAG_PX = 80;
/** 끌어서 이 높이(px)보다 낮아지면 시트를 닫는다. */
const MIN_SHEET_HEIGHT_PX = 120;

type StoreBottomSheetProps = {
  /** 매장 정보(선택 매장·길찾기) 내용. isInfoOpen이면 목록 대신 보여준다. */
  infoContent: ReactNode;
  /** 매장 정보 위에 고정해 둘 머리 줄(길찾기 제목·닫기). 스크롤 영역 밖에 두어 내용이 비쳐 보이지 않는다. */
  infoHeader?: ReactNode;
  /** 매장 정보 아래에 고정해 둘 줄(예약하기 버튼 등). 스크롤 영역 밖에 둔다. */
  infoFooter?: ReactNode;
  /** 매장 정보를 기본 높이로 보여줄 때의 높이 클래스. 없으면 내용만큼(최대 62%) 올라온다. */
  infoHeightClassName?: string;
  isInfoOpen: boolean;
  isListOpen: boolean;
  /** false면 끌어 내리거나 손잡이를 눌러도 시트를 닫지 않고 기본 높이까지만 내린다(길찾기 중). */
  canClose?: boolean;
  /** 위쪽 검색창 아래까지 펼친 상태인지(부모가 정한다. 예: 길찾기를 시작하면 펼친다). */
  isExpanded: boolean;
  onExpandedChange: (isExpanded: boolean) => void;
  /** 매장 목록 내용: 목록 상단·카테고리 뱃지·매장 리스트 */
  listContent: ReactNode;
  /** 핸들: 매장 정보 → 매장 목록 순서로 하나씩 닫고, 모두 닫혀 있으면 목록을 연다. */
  onHandleClick: () => void;
  sheetRef: RefObject<HTMLElement | null>;
};

/**
 * 모바일 지도 바텀 시트. 데스크톱 좌측 사이드바(A·B)와 같은 내용을 아래에서 올려 보여준다.
 * 검색창은 지도 위쪽에 그대로 두고, 시트에는 목록 또는 매장 정보 하나만 보여준다.
 * 손잡이를 위로 끌면 화면 위쪽(검색창 아래)까지 펼치고, 아래로 끌면 접거나 한 단계 닫는다.
 */
export const StoreBottomSheet = ({
  infoContent,
  infoFooter,
  infoHeader,
  infoHeightClassName,
  canClose = true,
  isExpanded,
  isInfoOpen,
  isListOpen,
  listContent,
  onExpandedChange,
  onHandleClick,
  sheetRef,
}: StoreBottomSheetProps) => {
  const setIsExpanded = onExpandedChange;
  const isOpen = isListOpen || isInfoOpen;
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    maxHeight: number;
    pointerId: number;
    startHeight: number;
    startY: number;
  } | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const handleLabel = isInfoOpen ? "매장 정보 닫기" : "매장 목록 닫기";

  /**
   * 손잡이 짧게 누르기(키보드 Enter·Space 포함): 펼쳐 둔 상태면 기본 높이로, 아니면 한 단계 닫는다.
   * 닫을 수 없는 시트(길찾기 중)는 펼치기·기본 높이를 오간다.
   */
  const handleTap = () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    if (!canClose) {
      setIsExpanded(true);
      return;
    }

    onHandleClick();
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const sheet = sheetRef.current;
    const container = sheet?.parentElement;

    if (!sheet || !container) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      // 펼친 높이: 위쪽 검색창(위 12px + 높이 40px)이 보이도록 64px를 남긴다.
      maxHeight: container.clientHeight - 64,
      pointerId: event.pointerId,
      startHeight: sheet.offsetHeight,
      startY: event.clientY,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaY = event.clientY - drag.startY;

    if (!isDragging && Math.abs(deltaY) < DRAG_THRESHOLD_PX) {
      return;
    }

    setIsDragging(true);
    setDragHeight(
      Math.min(drag.maxHeight, Math.max(0, drag.startHeight - deltaY)),
    );
  };

  const handlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;

    if (!isDragging) {
      handleTap();
      return;
    }

    const deltaY = event.clientY - drag.startY;
    const finalHeight = drag.startHeight - deltaY;

    setIsDragging(false);
    setDragHeight(null);

    if (deltaY < 0) {
      // 위로 끌기: 펼친다.
      setIsExpanded(true);
      return;
    }

    // 아래로 끌기: 펼쳐 둔 상태면 기본 높이로, 기본 높이에서 더 끌면 한 단계 닫는다.
    if (isExpanded && finalHeight > drag.maxHeight / 2) {
      setIsExpanded(false);
      return;
    }

    if (
      canClose &&
      (finalHeight < MIN_SHEET_HEIGHT_PX ||
        (isInfoOpen && deltaY > INFO_CLOSE_DRAG_PX) ||
        (!isExpanded && deltaY > INFO_CLOSE_DRAG_PX))
    ) {
      setIsExpanded(false);
      onHandleClick();
      return;
    }

    setIsExpanded(false);
  };

  return (
    // 지도 영역 전체를 기준으로 시트 높이(%)를 잡고, 시트는 아래쪽에 붙인다.
    <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col justify-end md:hidden">
      <button
        type="button"
        onClick={onHandleClick}
        className={cn(
          "text-text-primary pointer-events-auto absolute bottom-5 left-1/2 flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-extrabold shadow-lg transition-[translate,opacity] duration-300 dark:bg-zinc-950 dark:text-white",
          isOpen && "pointer-events-none translate-y-4 opacity-0",
        )}
        aria-hidden={isOpen}
        tabIndex={isOpen ? -1 : undefined}
      >
        <List size={14} />
        매장 목록 보기
      </button>

      <section
        ref={sheetRef}
        aria-label={isInfoOpen ? "매장 정보" : "매장 목록"}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "relative flex flex-col rounded-t-2xl bg-white shadow-[0_-8px_30px_rgba(25,31,40,0.14)] dark:bg-zinc-950",
          // 끄는 동안에는 손가락을 바로 따라오도록 애니메이션을 끈다.
          !isDragging &&
            "transition-[translate,height,max-height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          // 펼침: 위쪽 검색창 아래까지. 기본: 목록은 높이를 고정해 스크롤하고, 매장 정보는 내용만큼(최대 높이까지) 올라온다.
          isExpanded
            ? "h-[calc(100%-64px)]"
            : isInfoOpen
              ? (infoHeightClassName ?? "max-h-[62%]")
              : "h-[52%]",
          isOpen ? "pointer-events-auto translate-y-0" : "translate-y-full",
        )}
        style={
          dragHeight === null
            ? undefined
            : { height: dragHeight, maxHeight: "none" }
        }
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleTap();
            }
          }}
          // 손잡이를 끄는 동안 화면이 스크롤되지 않게 한다.
          className="flex h-8 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-2xl focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none active:cursor-grabbing"
          aria-label={
            canClose
              ? `${handleLabel} (위로 끌면 펼치기)`
              : isExpanded
                ? "시트 내리기"
                : "시트 펼치기"
          }
          title={handleLabel}
        >
          <span className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-white/20" />
        </button>
        {isInfoOpen ? (
          <>
            {infoHeader}
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6",
                infoHeader ? "pt-3" : "pt-1",
              )}
            >
              {infoContent}
            </div>
            {infoFooter}
          </>
        ) : (
          listContent
        )}
      </section>
    </div>
  );
};
