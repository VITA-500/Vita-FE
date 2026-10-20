import type { StoreRouteMode } from "@/entities/route";
import type { ChatMode } from "@/features/chat/types";
import type {
  MapCategory,
  StoreMapInitialAction,
} from "@/features/store/types";

type SearchParamsReader = Pick<URLSearchParams, "get" | "getAll">;

/** ?mode= 값을 채팅 화면 모드로 바꾼다. 모르는 값이면 채팅 화면이다. */
export const toChatMode = (modeParam: string | null): ChatMode =>
  modeParam === "store" || modeParam === "profile" ? modeParam : "chat";

const storeRouteModes = new Set<StoreRouteMode>([
  "walk",
  "car",
  "bicycle",
  "transit",
]);

/**
 * 매장 지도로 들어올 때 처음 할 동작(매장 선택·길찾기).
 * 예: /chat?mode=store&action=route&storeId=1&routeMode=walk
 */
export const getStoreMapInitialAction = (
  searchParams: SearchParamsReader,
): StoreMapInitialAction | null => {
  const storeId = searchParams.get("storeId");
  const actionParam = searchParams.get("action");

  if (!storeId || (actionParam !== "select" && actionParam !== "route")) {
    return null;
  }

  const routeModeParam = searchParams.get("routeMode");
  const routeMode = storeRouteModes.has(routeModeParam as StoreRouteMode)
    ? (routeModeParam as StoreRouteMode)
    : undefined;
  const categoryParam = searchParams.get("category");
  const category: MapCategory | undefined =
    categoryParam === "benefit" || categoryParam === "store"
      ? categoryParam
      : undefined;

  return {
    action: actionParam,
    activeServices: searchParams.getAll("service"),
    benefitCategory: searchParams.get("benefitCategory") ?? undefined,
    category,
    routeMode,
    storeId,
  };
};
