import type { ChatAction, ChatStoreMap } from "@/features/chat/types";
import { routes } from "@/shared/constants/routes";

/** "가까운 매장 보기" 기본 주소(/chat?mode=store)인지. 특정 매장을 가리키는 주소는 그대로 둔다. */
const isStoreMapHref = (href: string) => {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);

  return (
    path === routes.chat &&
    params.get("mode") === "store" &&
    !params.has("storeId")
  );
};

/**
 * 제휴 매장 답변의 "가까운 매장 보기"를 제휴 매장 지도로 연다.
 * 기본 주소(/chat?mode=store)는 휴대폰 매장 지도로 열려서, 제휴 매장을 보던 사용자가
 * 일반 상담 매장 핀을 보게 된다. 가장 가까운 제휴 매장을 선택한 상태로 제휴 카테고리를 연다.
 */
export const resolveChatActionHref = (
  action: ChatAction,
  storeMap?: ChatStoreMap,
) => {
  const nearestStore = storeMap?.stores[0];

  if (
    storeMap?.type !== "PARTNER" ||
    !nearestStore ||
    !isStoreMapHref(action.href)
  ) {
    return action.href;
  }

  const params = new URLSearchParams({
    mode: "store",
    action: "select",
    storeId: nearestStore.id,
    category: "benefit",
  });
  const benefitCategory = nearestStore.benefitCategory ?? storeMap.category;

  if (benefitCategory) params.set("benefitCategory", benefitCategory);

  return `${routes.chat}?${params.toString()}`;
};
