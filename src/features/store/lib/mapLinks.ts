import type { StoreLocation, StoreRouteMode } from "@/features/store/types";
import { routes } from "@/shared/constants/routes";

export const getKakaoDirectionUrl = (store: StoreLocation) => {
  const destinationName = encodeURIComponent(store.name);

  return `https://map.kakao.com/link/to/${destinationName},${store.lat},${store.lng}`;
};

export const getStoreMapRouteUrl = (
  store: StoreLocation,
  activeServices: readonly string[] = [],
  routeMode: StoreRouteMode = "walk",
) => {
  const params = new URLSearchParams({
    action: "route",
    mode: "store",
    routeMode,
    storeId: store.id,
  });

  if (store.storeType === "PARTNER") {
    params.set("category", "benefit");
    if (store.benefitCategory) {
      params.set("benefitCategory", store.benefitCategory);
    }
  }

  activeServices.forEach((service) => params.append("service", service));

  return `${routes.chat}?${params.toString()}`;
};
