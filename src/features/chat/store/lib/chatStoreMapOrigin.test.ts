import { describe, expect, it } from "vitest";
import {
  getChatStoreDistanceLabel,
  getChatStoreMapOriginPoint,
  getChatStoreMapUserLocation,
} from "@/features/chat/store/lib/chatStoreMapOrigin";

const origin = { lat: 37.65, lng: 127.04 };
const current = { lat: 37.5, lng: 127.0 };

describe("getChatStoreMapUserLocation", () => {
  it("현재 위치 기준(current)이면 BE origin을 내 위치로 쓴다", () => {
    expect(
      getChatStoreMapUserLocation({ origin, originSource: "current" }, null),
    ).toEqual(origin);
  });

  it("장소 기준(place)이면 파란 점을 두지 않는다", () => {
    // 예: "방학역 근처", "1호점 근처 다른 매장"
    expect(
      getChatStoreMapUserLocation({ origin, originSource: "place" }, null),
    ).toBeNull();
  });

  it("예전 기본 위치(default) 결과는 내 위치로 보여주지 않는다", () => {
    expect(
      getChatStoreMapUserLocation({ origin, originSource: "default" }, null),
    ).toBeNull();
  });

  it("위치가 없는 응답(origin·originSource null)이면 파란 점을 두지 않는다", () => {
    // BE null은 화면 모델로 바꿀 때 undefined가 된다(toChatStoreMap).
    expect(getChatStoreMapUserLocation({}, null)).toBeNull();
  });

  it("내 위치 버튼으로 받은 실제 위치가 있으면 기준과 관계없이 그 위치를 쓴다", () => {
    expect(
      getChatStoreMapUserLocation({ origin, originSource: "place" }, current),
    ).toEqual(current);
  });

  it("originSource가 없는 예전 저장 답변은 origin을 실제 위치로 본다", () => {
    expect(getChatStoreMapUserLocation({ origin }, null)).toEqual(origin);
  });
});

describe("getChatStoreMapOriginPoint", () => {
  it("장소 기준이면 기준점을 이름과 함께 돌려준다", () => {
    expect(
      getChatStoreMapOriginPoint({
        origin,
        originLabel: "왕십리",
        originSource: "place",
      }),
    ).toEqual({ ...origin, label: "왕십리" });
  });

  it("현재 위치 기준이면 기준점 핀을 두지 않는다", () => {
    expect(
      getChatStoreMapOriginPoint({ origin, originSource: "current" }),
    ).toBeNull();
  });
});

describe("getChatStoreDistanceLabel", () => {
  // 위도 0.01도 ≈ 1.1km
  const storePoint = { lat: 37.51, lng: 127.0 };

  it("현재 위치 기준이면 BE 거리 그대로 보여준다", () => {
    expect(
      getChatStoreDistanceLabel({
        distanceText: "약 120m",
        storeMap: { originSource: "current" },
        storePoint,
        userLocation: current,
      }),
    ).toEqual({ text: "약 120m" });
  });

  it("장소 기준이면 기준 장소 거리를 보여주고, 마우스를 올리면 내 위치 거리로 바꾼다", () => {
    expect(
      getChatStoreDistanceLabel({
        distanceText: "약 120m",
        storeMap: { originLabel: "왕십리", originSource: "place" },
        storePoint,
        userLocation: current,
      }),
    ).toEqual({
      text: "왕십리에서 약 120m",
      hoverText: "내 위치에서 약 1.1km",
    });
  });

  it("장소 기준인데 내 위치를 모르면 기준 장소 거리만 보여준다", () => {
    expect(
      getChatStoreDistanceLabel({
        distanceText: "약 120m",
        storeMap: { originLabel: "왕십리", originSource: "place" },
        storePoint,
        userLocation: null,
      }),
    ).toEqual({ text: "왕십리에서 약 120m", hoverText: undefined });
  });
});
