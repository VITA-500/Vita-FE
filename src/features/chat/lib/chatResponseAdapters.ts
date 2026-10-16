import type { ChatApiPlan, ChatApiStoreMap } from "../apiTypes";
import type { ChatPlan, ChatStoreMap } from "../types";

/** JSON의 null을 화면의 선택 필드(undefined)로 바꾼다. 서버 값의 의미는 바꾸지 않는다. */
const omitNulls = <T extends object>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null));

export const toChatPlan = (plan: ChatApiPlan): ChatPlan =>
  omitNulls(plan) as ChatPlan;

export const toChatStoreMap = (
  map?: ChatApiStoreMap | null,
): ChatStoreMap | undefined =>
  map
    ? ({
        ...omitNulls(map),
        stores: map.stores.map((store) => ({
          ...omitNulls(store),
          phone: store.phone ?? "",
        })),
      } as ChatStoreMap)
    : undefined;
