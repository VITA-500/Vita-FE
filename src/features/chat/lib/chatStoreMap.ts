import type { ChatStoreMap } from "@/features/chat/types";
import { storeService } from "@/features/store/lib/storeService";
import { defaultMapLocation } from "@/features/store/lib/storePanelStores";
import { findServicesInText } from "@/features/store/lib/serviceKeywords";

/** 채팅 카드·핀은 4곳까지 보여준다(ChatStoreMap과 같은 값). */
const MAX_CHAT_STORE_COUNT = 4;
/** 채팅 답변에서 매장을 찾는 반경(km). */
export const CHAT_STORE_RADIUS_KM = 3;

/** 위치를 받지 못했을 때 기준으로 삼는 곳. 안내 문구에 함께 보여준다. */
export const DEFAULT_CHAT_STORE_ORIGIN_LABEL = "선릉역 부근";

type ChatStorePoint = { lat: number; lng: number };

const getCurrentPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GEOLOCATION_UNSUPPORTED"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 60_000,
      timeout: 5000,
    });
  });

export const isStoreRelatedPrompt = (prompt: string) =>
  /매장|대리점|지점|방문|길찾기|가까운\s*곳|근처|오프라인/.test(prompt);

type StoreServiceFields = {
  consultServices?: readonly string[];
  providedServices?: readonly string[];
};

/** 매장이 제공하는 서비스 중 요청한 서비스(activeServices)에 해당하는 것 */
export const getMatchedServices = (
  store: StoreServiceFields,
  activeServices: readonly string[],
) => {
  const storeServices = new Set([
    ...(store.consultServices ?? []),
    ...(store.providedServices ?? []),
  ]);

  return activeServices.filter((service) => storeServices.has(service));
};

/**
 * 요청한 서비스를 많이 제공하는 매장을 먼저, 같으면 원래 순서(가까운 순)대로 둔다.
 * BE StoreService.findNearbyForChat과 같은 기준이다. 요청 서비스가 없으면 순서를 바꾸지 않는다.
 */
export const rankStoresByServices = <T extends StoreServiceFields>(
  stores: readonly T[],
  activeServices: readonly string[],
): T[] => {
  if (activeServices.length === 0) return [...stores];

  return stores
    .map((store, index) => ({
      index,
      matchCount: getMatchedServices(store, activeServices).length,
      store,
    }))
    .sort((a, b) => b.matchCount - a.matchCount || a.index - b.index)
    .map(({ store }) => store);
};

/** 기준 위치 주변 매장을 찾아 채팅 지도 블록 데이터로 만든다. */
export const findChatStoreMap = async ({
  activeServices,
  origin,
  originSource,
  prompt,
}: {
  /** 이미 정해진 강조 서비스(다시 찾기). 없으면 prompt에서 찾는다. */
  activeServices?: string[];
  origin: ChatStorePoint;
  originSource: NonNullable<ChatStoreMap["originSource"]>;
  prompt?: string;
}): Promise<ChatStoreMap | undefined> => {
  const nearbyStores = await storeService.fetchNearbyStores(
    origin,
    CHAT_STORE_RADIUS_KM,
  );
  if (nearbyStores.length === 0) {
    return undefined;
  }

  // 질문에 나온 서비스는 반경 안 전체 매장 기준으로 찾는다(가까운 4곳에 없어도 강조 대상이 되도록).
  const availableServices = Array.from(
    new Set(
      nearbyStores.flatMap((store) => [
        ...(store.consultServices ?? []),
        ...(store.providedServices ?? []),
      ]),
    ),
  );
  const resolvedActiveServices =
    activeServices ??
    (prompt ? findServicesInText(prompt, availableServices) : []);
  // 주변 조회는 BE가 가까운 순으로 준다. 요청 서비스가 되는 매장을 앞으로 당긴 뒤 4곳을 고른다.
  // 카드에는 이름·거리·서비스만 보여주므로 매장별 상세(/stores/{id}) 호출은 하지 않는다.
  const storeSummaries = rankStoresByServices(
    nearbyStores,
    resolvedActiveServices,
  ).slice(0, MAX_CHAT_STORE_COUNT);

  return {
    activeServices: resolvedActiveServices,
    origin,
    originSource,
    stores: storeSummaries,
  };
};

export const createChatStoreMap = async (
  prompt: string,
): Promise<ChatStoreMap | undefined> => {
  const currentOrigin = await getCurrentPosition()
    .then((position) => ({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }))
    .catch(() => null);

  return findChatStoreMap({
    origin: currentOrigin ?? defaultMapLocation,
    originSource: currentOrigin ? "current" : "default",
    prompt,
  });
};
