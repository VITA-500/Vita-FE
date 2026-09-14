import type { StoreLocation } from "@/features/store/types";

export const getKakaoDirectionUrl = (store: StoreLocation) => {
  const destinationName = encodeURIComponent(store.name);

  return `https://map.kakao.com/link/to/${destinationName},${store.lat},${store.lng}`;
};
