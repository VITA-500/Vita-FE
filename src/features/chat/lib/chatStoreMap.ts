import type { ChatStoreMap } from "@/features/chat/types";
import { benefitService } from "@/features/store/lib/benefitService";
import { getDistanceMeters } from "@/features/store/lib/geo";
import { storeService } from "@/features/store/lib/storeService";
import { findServicesInText } from "@/features/store/lib/serviceKeywords";
import type { StoreLocation } from "@/features/store/types";

/** 채팅 카드·핀은 4곳까지 보여준다(ChatStoreMap과 같은 값). */
const MAX_CHAT_STORE_COUNT = 4;
/** 채팅 답변에서 매장을 찾는 반경(km). */
export const CHAT_STORE_RADIUS_KM = 3;

type ChatStorePoint = { lat: number; lng: number };

const CHAT_LOCATION_STORAGE_KEY = "vita-chat-last-location";

const getCurrentPosition = (options: PositionOptions) =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GEOLOCATION_UNSUPPORTED"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const toChatStorePoint = (position: GeolocationPosition): ChatStorePoint => ({
  lat: position.coords.latitude,
  lng: position.coords.longitude,
});

const readCachedChatLocation = (): ChatStorePoint | null => {
  try {
    const parsed = JSON.parse(
      window.sessionStorage.getItem(CHAT_LOCATION_STORAGE_KEY) ?? "null",
    ) as Partial<ChatStorePoint> | null;

    return typeof parsed?.lat === "number" && typeof parsed.lng === "number"
      ? { lat: parsed.lat, lng: parsed.lng }
      : null;
  } catch {
    return null;
  }
};

const saveChatLocation = (location: ChatStorePoint) => {
  try {
    window.sessionStorage.setItem(
      CHAT_LOCATION_STORAGE_KEY,
      JSON.stringify(location),
    );
  } catch {
    // 위치 캐시는 실패해도 다음 요청만 다시 확인하면 된다.
  }
};

export const getCurrentChatLocation = async () => {
  const attempts: PositionOptions[] = [
    { enableHighAccuracy: true, maximumAge: 180_000, timeout: 10_000 },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
  ];

  for (const options of attempts) {
    try {
      const location = toChatStorePoint(await getCurrentPosition(options));

      saveChatLocation(location);
      return location;
    } catch {
      // 허용 상태에서도 일시적으로 timeout이 날 수 있어 한 번 더 요청한다.
    }
  }

  return readCachedChatLocation();
};

export const isStoreRelatedPrompt = (prompt: string) =>
  /매장|대리점|지점|방문|길찾기|가까운\s*곳|근처|오프라인/.test(prompt);

export const isPartnerStorePrompt = (prompt: string) =>
  /제휴|혜택|할인|멤버십|서비스\s*매장|카페|영화관|편의점|베이커리|외식|쇼핑/.test(
    prompt,
  );

export const shouldUseLocalStoreFallback = (prompt: string) =>
  isStoreRelatedPrompt(prompt) && !isPartnerStorePrompt(prompt);

export const shouldUsePartnerStoreFallback = (
  prompt: string,
  storeMap?: ChatStoreMap,
) =>
  isPartnerStorePrompt(prompt) &&
  storeMap?.type !== "PARTNER" &&
  !hasRequestedServiceStoreMap(storeMap);

export const hasRequestedServiceStoreMap = (storeMap?: ChatStoreMap) =>
  Boolean(storeMap?.stores.length && storeMap.activeServices?.length);

type StoreServiceFields = {
  consultServices?: readonly string[];
  providedServices?: readonly string[];
};

const getPartnerServiceFallback = (store: StoreLocation) =>
  store.benefitName || store.benefitBrand || store.benefitCategory || "";

const toPartnerChatStore = (store: StoreLocation) => {
  const currentServices = (store.providedServices ?? []).filter(
    (service) => service.trim().length > 0,
  );
  const providedServices =
    currentServices.length > 0
      ? currentServices
      : [getPartnerServiceFallback(store)].filter(Boolean);

  return {
    ...store,
    providedServices,
  };
};

const getMatchingBenefitCategories = (
  categories: Awaited<ReturnType<typeof benefitService.fetchBenefitCategories>>,
  prompt?: string,
) => {
  if (!prompt) return categories;

  const matchedCategories = categories.filter(
    (category) =>
      prompt.includes(category.label) || prompt.includes(category.value),
  );

  return matchedCategories.length > 0 ? matchedCategories : categories;
};

const getUniquePartnerStores = (
  stores: StoreLocation[],
  origin: ChatStorePoint,
) => {
  const storeByKey = new Map<string, StoreLocation>();

  stores.forEach((store) => {
    storeByKey.set(`${store.id}:${store.benefitId ?? ""}`, store);
  });

  return Array.from(storeByKey.values()).sort(
    (first, second) =>
      getDistanceMeters(origin, first) - getDistanceMeters(origin, second),
  );
};

const fetchPartnerStoresByCategory = (
  category: string,
  origin: ChatStorePoint,
) => benefitService.fetchBenefitStores(category, origin, CHAT_STORE_RADIUS_KM);

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

export const findPartnerChatStoreMap = async ({
  origin,
  originSource,
  prompt,
}: {
  origin: ChatStorePoint;
  originSource: NonNullable<ChatStoreMap["originSource"]>;
  prompt?: string;
}): Promise<ChatStoreMap | undefined> => {
  const categories = await benefitService.fetchBenefitCategories();
  const targetCategories = getMatchingBenefitCategories(categories, prompt);
  const categoryResults = await Promise.allSettled(
    targetCategories.map((category) =>
      fetchPartnerStoresByCategory(category.value, origin),
    ),
  );
  const partnerStores = getUniquePartnerStores(
    categoryResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value.map(toPartnerChatStore) : [],
    ),
    origin,
  ).slice(0, MAX_CHAT_STORE_COUNT);

  if (partnerStores.length === 0) {
    return undefined;
  }

  const activeServices = Array.from(
    new Set(
      partnerStores
        .flatMap((store) => store.providedServices ?? [])
        .filter((service) => service.trim().length > 0),
    ),
  ).slice(0, 4);

  return {
    type: "PARTNER",
    activeServices,
    origin,
    originSource,
    stores: partnerStores,
  };
};

export const createChatStoreMap = async (
  prompt: string,
): Promise<ChatStoreMap | undefined> => {
  const currentOrigin = await getCurrentChatLocation();

  if (!currentOrigin) {
    return undefined;
  }

  return findChatStoreMap({
    origin: currentOrigin,
    originSource: "current",
    prompt,
  });
};
