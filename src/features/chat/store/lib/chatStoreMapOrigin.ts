import { formatDistance, getDistanceMeters } from "@/shared/lib/geo";
import type { ChatStoreMap } from "@/entities/chat";

type Point = { lat: number; lng: number };

/** 사용자의 현재 위치에서 장소/매장까지 탐색하려는 질문인지 판별한다. */
export const isUserOriginNavigationPrompt = (prompt: string) =>
  /내\s*위치|여기서|얼마나\s*걸려|가는\s*(?:법|길)|길찾기|어떻게\s*가/.test(
    prompt,
  );

/**
 * 채팅 매장 지도의 "내 위치"(파란 점).
 * - 내 위치 버튼으로 받은 실제 위치가 있으면 그 위치
 * - 없으면 BE origin을 쓰되, 기준이 현재 위치(originSource "current")일 때만
 *   "place"(질문에 나온 장소 기준, 예: "방학역 근처")·"default"(예전 기본 위치)는 내 위치가 아니라서 쓰지 않는다.
 * - originSource가 없는 예전 저장 답변은 기존처럼 실제 위치로 본다.
 *   (지금 BE는 위치가 없으면 origin·originSource를 모두 null로 보내 이 경우와 겹치지 않는다.)
 */
export const getChatStoreMapUserLocation = (
  storeMap: Pick<ChatStoreMap, "origin" | "originSource">,
  currentLocation: Point | null,
  placeUserLocation: Point | null = null,
): Point | null => {
  if (currentLocation) return currentLocation;
  if (storeMap.originSource === "place" && placeUserLocation) {
    return placeUserLocation;
  }
  if (!storeMap.origin) return null;

  const isCurrentOrigin =
    storeMap.originSource === "current" || storeMap.originSource === undefined;

  return isCurrentOrigin ? storeMap.origin : null;
};

/** 장소 기준 검색이면 그 기준점(예: "왕십리")을 지도에 따로 표시한다. 현재 위치 기준이면 null. */
export const getChatStoreMapOriginPoint = (
  storeMap: Pick<ChatStoreMap, "origin" | "originLabel" | "originSource">,
) =>
  storeMap.originSource === "place" && storeMap.origin
    ? {
        lat: storeMap.origin.lat,
        lng: storeMap.origin.lng,
        label: storeMap.originLabel?.trim() || "검색 기준",
      }
    : null;

export type ChatStoreDistanceLabel = {
  /** 카드에 기본으로 보이는 거리 */
  text: string;
  /** 거리 문구에 마우스를 올렸을 때 바꿔 보여줄 거리(장소 기준일 때 내 위치에서의 거리) */
  hoverText?: string;
};

/**
 * 매장 카드의 거리 문구.
 * - 현재 위치 기준: BE 거리 그대로("약 120m")
 * - 장소 기준: "왕십리역에서 약 120m", 내 위치를 알면 마우스를 올렸을 때 "내 위치에서 약 2.3km"
 * - 장소 거리가 없고 내 위치만 알면 내 위치 거리를 기본으로 보여준다.
 */
export const getChatStoreDistanceLabel = ({
  distanceText,
  storeMap,
  storePoint,
  userLocation,
}: {
  distanceText?: string;
  storeMap: Pick<ChatStoreMap, "originLabel" | "originSource">;
  storePoint: Point;
  userLocation: Point | null;
}): ChatStoreDistanceLabel | undefined => {
  if (storeMap.originSource !== "place") {
    return distanceText ? { text: distanceText } : undefined;
  }

  const label = storeMap.originLabel?.trim();
  const fromPlace = distanceText
    ? label
      ? `${label}에서 ${distanceText}`
      : distanceText
    : undefined;
  const fromUser = userLocation
    ? `내 위치에서 ${formatDistance(getDistanceMeters(userLocation, storePoint))}`
    : undefined;

  if (fromPlace) return { text: fromPlace, hoverText: fromUser };
  return fromUser ? { text: fromUser } : undefined;
};
