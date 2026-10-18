/**
 * 데스크톱 레이아웃 기준 너비(Tailwind md).
 * 예: 매장 지도는 이 너비부터 패널을 좌측 사이드바로, 그 아래는 바텀 시트로 보여준다.
 */
export const DESKTOP_MIN_WIDTH_PX = 768;

/** 이 너비(px)가 데스크톱 레이아웃인지 */
export const isDesktopWidth = (width: number) => width >= DESKTOP_MIN_WIDTH_PX;
