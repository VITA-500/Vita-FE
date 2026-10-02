import type { CSSProperties, ReactNode, RefObject } from "react";
import { cn } from "@/shared/lib/cn";

type StoreMapSelectedCardProps = {
  cardRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  /** 지도 확대/축소로 초점을 옮기는 중인지(카드를 잠시 흐리게) */
  isMapAnimating: boolean;
  /** 초점 이동으로 카드 자리를 확보해 보여줘도 되는지 */
  isRevealed: boolean;
  /** 길찾기 도착 매장 카드인지 */
  isRouteCardDocked: boolean;
  /** 길찾기 경로를 그리기 전·그리는 동안인지(카드를 접어 둔다) */
  isRouteCardHeld: boolean;
  style: CSSProperties;
};

/** 선택 매장 핀 바로 위에 붙는 정보 카드 틀 */
export const StoreMapSelectedCard = ({
  cardRef,
  children,
  isMapAnimating,
  isRevealed,
  isRouteCardDocked,
  isRouteCardHeld,
  style,
}: StoreMapSelectedCardProps) => (
  <div
    ref={cardRef}
    className={cn(
      // 카드는 항상 핀 바로 위(핀 끝에서 64px 위)에 뜬다.
      "pointer-events-auto absolute z-40 origin-bottom -translate-x-1/2 -translate-y-[calc(100%+64px)] transition-[opacity,scale] duration-300 ease-out",
      // 매장을 새로 고르면 초점 이동으로 카드 자리를 확보한 뒤에 나타난다(그 전엔 보이지 않게 크기만 잰다).
      // 길찾기 경로를 그리는 동안에는 카드를 접어 두고, 다 그린 뒤 펼친다.
      isRouteCardHeld
        ? "pointer-events-none scale-95 opacity-0"
        : !isRevealed
          ? "pointer-events-none opacity-0"
          : isMapAnimating && "opacity-40",
      isRouteCardDocked
        ? // 길찾기 카드: 도착 매장 핀 바로 위에 붙이고, 브랜드 테두리로 눈에 띄게 한다.
          "ring-brand w-[min(300px,calc(100%-24px))] rounded-sm shadow-[0_12px_32px_rgba(253,182,29,0.28)] ring-2"
        : "w-[min(320px,calc(100%-24px))]",
    )}
    onClick={(event) => event.stopPropagation()}
    style={style}
  >
    {children}
  </div>
);
