/*
 * 선택 매장 카드의 스크롤 영역 연결값.
 * 카드(StorePanelInfoBubble)는 스크롤 영역에 이 속성을 달고, 최대 높이로 이 CSS 변수를 쓴다.
 * 지도(useKeepSelectedCardInView)는 지도 크기에 맞춰 변수 값을 넣어, 카드가 지도 위로 넘치지 않게 한다.
 */

/** 카드 안에서 스크롤되는 영역 표시 속성 */
export const STORE_CARD_SCROLL_AREA_ATTRIBUTE = "data-store-card-scroll-area";
/** 카드 스크롤 영역 최대 높이를 넘겨주는 CSS 변수 */
export const STORE_CARD_SCROLL_MAX_HEIGHT_VAR = "--store-card-scroll-max-h";
