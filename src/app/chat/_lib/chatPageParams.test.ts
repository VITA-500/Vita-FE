import { describe, expect, it } from "vitest";
import { getStoreMapInitialAction, toChatMode } from "./chatPageParams";

describe("chatPageParams", () => {
  it("모르는 mode 값은 채팅 화면으로 본다", () => {
    expect(toChatMode("store")).toBe("store");
    expect(toChatMode("profile")).toBe("profile");
    expect(toChatMode("unknown")).toBe("chat");
    expect(toChatMode(null)).toBe("chat");
  });

  it("매장 지도 처음 동작을 주소에서 읽는다", () => {
    const params = new URLSearchParams(
      "mode=store&action=route&storeId=12&routeMode=walk&category=benefit&benefitCategory=cafe&service=휴대폰상담&service=로밍상담",
    );

    expect(getStoreMapInitialAction(params)).toEqual({
      action: "route",
      activeServices: ["휴대폰상담", "로밍상담"],
      benefitCategory: "cafe",
      category: "benefit",
      routeMode: "walk",
      storeId: "12",
    });
  });

  it("채팅 질문 조건(service)만 들고 오면 필터 동작으로 읽는다", () => {
    expect(
      getStoreMapInitialAction(
        new URLSearchParams(
          "mode=store&action=filter&service=로밍상담&service=주차 가능",
        ),
      ),
    ).toEqual({
      action: "filter",
      activeServices: ["로밍상담", "주차 가능"],
      storeId: "",
    });
    expect(
      getStoreMapInitialAction(new URLSearchParams("mode=store&action=filter")),
    ).toBeNull();
  });

  it("매장 id나 동작이 없거나 모르는 값이면 처음 동작이 없다", () => {
    expect(
      getStoreMapInitialAction(new URLSearchParams("action=select")),
    ).toBeNull();
    expect(
      getStoreMapInitialAction(new URLSearchParams("storeId=1&action=open")),
    ).toBeNull();
    expect(
      getStoreMapInitialAction(
        new URLSearchParams(
          "storeId=1&action=select&routeMode=plane&category=x",
        ),
      ),
    ).toMatchObject({ routeMode: undefined, category: undefined });
  });
});
