import type { ChatStoreMap as ChatStoreMapData } from "@/entities/chat";

/** 답변 속 매장 지도에 보여줄 최대 매장 수 */
export const MAX_CHAT_STORE_COUNT = 5;
/** BE가 기본 위치 이름(originLabel)을 보내기 전 응답에 쓰는 이름 */
export const LEGACY_DEFAULT_CHAT_STORE_ORIGIN_LABEL = "선릉역 부근";

/** 채팅 매장 지도 데이터 한 건을 매장 지도 컴포넌트가 쓰는 매장 모양으로 바꾼다. */
export const toStoreLocation = (
  store: ChatStoreMapData["stores"][number],
  storeMap: ChatStoreMapData,
) => ({
  ...store,
  address: store.address || "주소 정보 확인 중",
  benefitCategory: store.benefitCategory ?? storeMap.category ?? undefined,
  benefitId: store.benefitId ?? storeMap.benefitId ?? undefined,
  phone: store.phone || "",
  storeType: storeMap.type ?? undefined,
});

/**
 * 채팅 답변 안의 낮은 지도(약 300px)용 핀 맞춤 여백.
 * 매장 지도 화면의 기본 여백(위 120px·오른쪽 96px, 검색창·목록용)을 그대로 쓰면 핀이 들어갈 공간이 좁아
 * 지도가 크게 축소되고 핀이 작게 보인다. 위는 핀 높이, 오른쪽 아래는 지도 버튼만큼만 남긴다.
 */
export const getChatMapPinFitPadding = () => ({
  bottom: 28,
  left: 28,
  right: 52,
  top: 52,
});
