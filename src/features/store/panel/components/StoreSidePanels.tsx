import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { cn } from "@/shared/lib/cn";

const panelTransitionClassName =
  "transition-[translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
const panelSurfaceClassName =
  "border-border flex flex-col border-r bg-white dark:border-white/10 dark:bg-zinc-950";

type StoreSidePanelsProps = {
  /** 매장 정보 패널(B) 안 내용: 선택 매장 정보·길찾기 */
  infoContent: ReactNode;
  infoPanelRef: RefObject<HTMLElement | null>;
  isInfoOpen: boolean;
  isListOpen: boolean;
  /** 매장 목록 패널(A) 안 내용: 목록 상단·카테고리 뱃지·매장 리스트(검색창은 지도 위 그대로 둔다) */
  listContent: ReactNode;
  /** A에 지금 보이는 내용 이름(매장 목록 / 길찾기). 패널·핸들 이름표에 쓴다. */
  listLabel?: string;
  listPanelRef: RefObject<HTMLElement | null>;
  /** 핸들: 열린 패널을 바깥쪽(B → A)부터 하나씩 닫고, 모두 닫혀 있으면 A를 연다. */
  onHandleClick: () => void;
};

/**
 * 데스크톱 지도 왼쪽 사이드바.
 * - A(매장 목록): 지도 위 검색창 블록을 덮는 너비로 왼쪽에서 밀려 나온다. 검색창은 A 위쪽 자리에 그대로 떠 있다.
 * - B(매장 정보): 매장을 고르면 A 오른쪽에 붙어 A 뒤에서 밀려 나온다.
 * - 핸들은 가장 바깥에 열린 패널의 오른쪽 끝에 붙는다.
 */
export const StoreSidePanels = ({
  infoContent,
  infoPanelRef,
  isInfoOpen,
  isListOpen,
  listContent,
  listLabel = "매장 목록",
  listPanelRef,
  onHandleClick,
}: StoreSidePanelsProps) => {
  const handleLabel = isInfoOpen
    ? "매장 정보 닫기"
    : isListOpen
      ? `${listLabel} 닫기`
      : "매장 목록 열기";

  return (
    // 지도(z-auto) 위, 검색창·필터 줄(z-10) 아래에 둔다. 검색창이 A 위쪽에 겹쳐 보이도록.
    <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden md:block">
      <aside
        ref={infoPanelRef}
        aria-label="매장 정보"
        aria-hidden={!isInfoOpen}
        inert={!isInfoOpen}
        className={cn(
          panelSurfaceClassName,
          panelTransitionClassName,
          "absolute inset-y-0 left-[400px] w-[380px] shadow-[8px_0_24px_rgba(25,31,40,0.08)] lg:left-[460px]",
          // 닫히면 A 뒤로 접혀 들어간다. A도 닫혀 있으면 A와 함께 화면 밖까지 밀려 나간다.
          isInfoOpen
            ? "pointer-events-auto translate-x-0"
            : isListOpen
              ? "-translate-x-full"
              : "-translate-x-[calc(100%+400px)] lg:-translate-x-[calc(100%+460px)]",
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-6 pb-8">
          {infoContent}
        </div>
      </aside>

      <aside
        ref={listPanelRef}
        aria-label={listLabel}
        aria-hidden={!isListOpen}
        inert={!isListOpen}
        className={cn(
          panelSurfaceClassName,
          panelTransitionClassName,
          "absolute inset-y-0 left-0 z-10 w-[400px] lg:w-[460px]",
          // B가 열려 있으면 그림자는 B 쪽에서만 보이게 한다.
          !isInfoOpen && "shadow-[8px_0_24px_rgba(25,31,40,0.08)]",
          isListOpen
            ? "pointer-events-auto translate-x-0"
            : "-translate-x-full",
        )}
      >
        {/* 지도 위 검색창(위 20px + 높이 48px)이 들어오는 자리 */}
        <div className="h-20 shrink-0" aria-hidden="true" />
        {listContent}
      </aside>

      <button
        type="button"
        onClick={onHandleClick}
        className={cn(
          "border-border text-text-secondary hover:text-text-primary pointer-events-auto absolute top-1/2 z-20 flex h-16 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 bg-white shadow-[4px_0_12px_rgba(25,31,40,0.08)] transition-[left,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:outline-none dark:border-white/10 dark:bg-zinc-950 dark:text-gray-400 dark:hover:text-white",
          isInfoOpen
            ? "left-[780px] lg:left-[840px]"
            : isListOpen
              ? "left-[400px] lg:left-[460px]"
              : "left-0",
        )}
        aria-label={handleLabel}
        title={handleLabel}
      >
        {isListOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </div>
  );
};
