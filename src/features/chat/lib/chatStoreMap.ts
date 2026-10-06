import type { ChatStoreMap } from "@/features/chat/types";
import { storeService } from "@/features/store/lib/storeService";
import { defaultMapLocation } from "@/features/store/lib/storePanelStores";
import { findServicesInText } from "@/features/store/lib/serviceKeywords";

const MAX_CHAT_STORE_COUNT = 5;

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

export const createChatStoreMap = async (
  prompt: string,
): Promise<ChatStoreMap | undefined> => {
  const origin = await getCurrentPosition()
    .then((position) => ({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }))
    .catch(() => defaultMapLocation);
  const nearbyStores = await storeService.fetchNearbyStores(origin, 3);
  const stores = nearbyStores.slice(0, MAX_CHAT_STORE_COUNT);

  if (stores.length === 0) {
    return undefined;
  }

  const detailedStores = await Promise.all(
    stores.map((store) =>
      storeService.fetchStoreDetail(store.id, store).catch(() => store),
    ),
  );
  const storeSummaries = detailedStores
    .map((store) => store ?? stores[0])
    .slice(0, MAX_CHAT_STORE_COUNT);
  const availableServices = Array.from(
    new Set(
      storeSummaries.flatMap((store) => [
        ...(store.consultServices ?? []),
        ...(store.providedServices ?? []),
      ]),
    ),
  );

  return {
    activeServices: findServicesInText(prompt, availableServices),
    origin,
    stores: storeSummaries,
  };
};
