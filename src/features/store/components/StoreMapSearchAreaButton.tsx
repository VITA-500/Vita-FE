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
    className="bg-brand hover:bg-brand-hover pointer-events-auto absolute bottom-6 left-1/2 z-30 flex h-10 -translate-x-1/2 items-center gap-2 rounded-full px-5 text-sm font-extrabold whitespace-nowrap text-white shadow-lg transition disabled:cursor-wait disabled:opacity-80"
  >
    <RotateCcw size={16} className={cn(isLoading && "animate-spin")} />이
    지역에서 재검색
  </button>
);
