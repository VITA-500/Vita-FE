import { describe, expect, it } from "vitest";
import { resolveChatActionHref } from "@/features/chat/store/lib/chatStoreActions";
import type { ChatStoreMap } from "@/entities/chat";

const storeMapAction = { label: "가까운 매장 보기", href: "/chat?mode=store" };
const store = {
  id: "8555",
  name: "루나빈 강남점",
  address: "서울 강남구",
  phone: "",
  lat: 37.5,
  lng: 127.04,
};

const partnerMap = (overrides: Partial<ChatStoreMap> = {}): ChatStoreMap => ({
  type: "PARTNER",
  category: "카페",
  stores: [store],
  ...overrides,
});

const queryOf = (href: string) =>
  Object.fromEntries(new URLSearchParams(href.split("?")[1]));

describe("resolveChatActionHref", () => {
  it("opens the partner map with the nearest partner store selected", () => {
    expect(
      queryOf(resolveChatActionHref(storeMapAction, partnerMap())),
    ).toEqual({
      mode: "store",
      action: "select",
      storeId: "8555",
      category: "benefit",
      benefitCategory: "카페",
    });
  });

  it("prefers the store's own benefit category", () => {
    expect(
      queryOf(
        resolveChatActionHref(
          storeMapAction,
          partnerMap({
            category: null,
            stores: [{ ...store, benefitCategory: "아이스크림" }],
          }),
        ),
      ).benefitCategory,
    ).toBe("아이스크림");
  });

  it("opens the phone store map with the question's service filters", () => {
    const href = resolveChatActionHref(storeMapAction, {
      type: "PHONE",
      activeServices: ["로밍상담", "주차 가능"],
      stores: [store],
    });
    const params = new URLSearchParams(href.split("?")[1]);

    expect(params.get("mode")).toBe("store");
    expect(params.get("action")).toBe("filter");
    expect(params.getAll("service")).toEqual(["로밍상담", "주차 가능"]);
  });

  it("keeps phone store and unrelated actions as they are", () => {
    expect(
      resolveChatActionHref(storeMapAction, {
        type: "PHONE",
        stores: [store],
      }),
    ).toBe("/chat?mode=store");
    expect(resolveChatActionHref(storeMapAction)).toBe("/chat?mode=store");
    expect(
      resolveChatActionHref(
        { label: "요금제 보기", href: "/plans" },
        partnerMap(),
      ),
    ).toBe("/plans");
  });
});
