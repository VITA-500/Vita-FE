import { routes } from "@/shared/constants/routes";
import type { ChatAction, ChatStoreMap } from "@/entities/chat";

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
  const activeServices = storeMap?.activeServices ?? [];

  // 휴대폰 매장 답변에 질문 조건(예: 로밍상담·주차 가능)이 있으면 지도도 그 조건 필터를 켜고 연다.
  // 조건 없이 열면 답변에서 본 매장과 달리 주변 매장 전체가 보여 흐름이 끊긴다.
  if (
    storeMap?.type !== "PARTNER" &&
    activeServices.length > 0 &&
    isStoreMapHref(action.href)
  ) {
    const params = new URLSearchParams({ mode: "store", action: "filter" });

    activeServices.forEach((service) => params.append("service", service));

    return `${routes.chat}?${params.toString()}`;
  }

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
