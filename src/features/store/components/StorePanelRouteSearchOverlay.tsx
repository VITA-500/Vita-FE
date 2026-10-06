type StorePanelRouteSearchOverlayProps = {
  /** 경로를 불러오는 중인지(false면 지도 범위를 맞추는 중) */
  isRouteLoading: boolean;
};

/** 길찾기: 경로를 불러오거나 지도 범위를 맞추는 동안 지도를 덮는 "경로 탐색 중" 안내 */
export const StorePanelRouteSearchOverlay = ({
  isRouteLoading,
}: StorePanelRouteSearchOverlayProps) => (
  <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-gray-950/45 px-6 backdrop-blur-[2px]">
    <div className="border-border w-full max-w-[320px] rounded-sm border bg-white/95 p-5 text-center shadow-2xl dark:border-white/10 dark:bg-zinc-950/95">
      <span
        aria-hidden="true"
        className="border-brand mx-auto block size-8 animate-spin rounded-full border-4 border-t-transparent"
      />
      <p className="mt-4 text-sm font-extrabold text-gray-950 dark:text-white">
        경로 탐색 중입니다
      </p>
      <p className="text-text-secondary mt-2 text-xs leading-5 font-semibold">
        {isRouteLoading
          ? "현재 위치에서 선택한 매장까지의 경로와 예상 시간을 계산하고 있어요."
          : "출발지부터 도착지까지 한눈에 보이도록 지도를 맞추고 있어요."}
      </p>
    </div>
  </div>
);
