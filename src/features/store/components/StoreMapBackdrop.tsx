import { cn } from "@/shared/lib/cn";

/** 카카오맵 SDK를 쓸 수 없을 때(대체 지도) 지도 대신 깔리는 배경 */
export const StoreMapFallbackBackground = () => (
  <>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_46%_42%,rgba(255,179,25,0.22),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(246,248,251,0.96))] dark:bg-[radial-gradient(circle_at_46%_42%,rgba(255,179,25,0.2),transparent_28%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))]" />
    <div className="absolute inset-0 [background-image:linear-gradient(rgba(100,116,139,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.14)_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.38]" />
  </>
);

/** 대체 지도 위 은은한 브랜드 색 번짐(장식) */
export const StoreMapFallbackGlow = () => (
  <>
    <div className="bg-brand/15 pointer-events-none absolute top-[17%] left-[14%] h-24 w-24 rounded-full blur-2xl" />
    <div className="absolute right-[16%] bottom-[18%] h-32 w-32 rounded-full bg-orange-300/20 blur-3xl" />
  </>
);

type StoreMapLoadingOverlayProps = {
  isVisible: boolean;
};

/** 지도가 처음 그려지기 전(SDK 로딩, 기준 지점 대기, 타일 로딩)에 보여주는 로딩 화면 */
export const StoreMapLoadingOverlay = ({
  isVisible: isMapLoadingVisible,
}: StoreMapLoadingOverlayProps) => (
  <div
    aria-hidden={!isMapLoadingVisible}
    className={cn(
      "absolute inset-0 z-40 flex items-center justify-center bg-gray-50 transition-opacity duration-300 dark:bg-zinc-950",
      isMapLoadingVisible ? "opacity-100" : "pointer-events-none opacity-0",
    )}
  >
    <div className="flex flex-col items-center gap-3" role="status">
      <span
        aria-hidden="true"
        className="border-brand size-8 animate-spin rounded-full border-4 border-t-transparent"
      />
      <p className="text-sm font-extrabold text-gray-700 dark:text-gray-200">
        지도를 불러오는 중이에요
      </p>
    </div>
  </div>
);
