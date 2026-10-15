import { RotateCcw } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type StoreMapSearchAreaButtonProps = {
  isLoading: boolean;
  onClick: () => void;
};

/** 지도를 옮긴 뒤 나타나는 "이 지역에서 재검색" 버튼 */
export const StoreMapSearchAreaButton = ({
  isLoading,
  onClick,
}: StoreMapSearchAreaButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    // 데스크톱: 좌측 사이드바가 열려 있으면 가리지 않는 영역의 가운데로 옮긴다(StoreMapPreview의 CSS 변수).
    // 모바일: 아래쪽은 바텀 시트 자리라 위쪽 검색창 바로 아래에 작게 띄운다.
    className="bg-brand hover:bg-brand-hover pointer-events-auto absolute top-[64px] left-1/2 z-30 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 text-xs font-extrabold whitespace-nowrap text-white shadow-lg transition disabled:cursor-wait disabled:opacity-80 md:top-auto md:bottom-[calc(24px+var(--map-overlay-bottom,0px))] md:left-[calc(var(--map-overlay-left,0px)+(100%-var(--map-overlay-left,0px))/2)] md:h-10 md:gap-2 md:px-5 md:text-sm"
  >
    <RotateCcw
      className={cn("size-3.5 md:size-4", isLoading && "animate-spin")}
    />
    이 지역에서 재검색
  </button>
);
