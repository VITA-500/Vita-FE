import { afterEach, describe, expect, it } from "vitest";
import type { ChatMessage, ChatStoreMap } from "@/features/chat/types";
import { chatStoreMapCache, restoreCachedStoreMaps } from "./chatStoreMapCache";

const storeMap: ChatStoreMap = {
  origin: { lat: 37.5, lng: 127.03 },
  originSource: "current",
  stores: [
    {
      id: "12",
      name: "VITA 강남점",
      address: "",
      phone: "",
      lat: 37.498,
      lng: 127.027,
      distanceText: "420m",
    },
  ],
};

const message = (id: string, role: ChatMessage["role"]): ChatMessage => ({
  id,
  role,
  content: "가까운 매장은 아래 지도에서 확인하실 수 있어요.",
  createdAt: "2026-10-07T05:00:00.000Z",
});

describe("chatStoreMapCache", () => {
  afterEach(() => window.localStorage.clear());

  it("restores the store map for a reloaded assistant message", () => {
    chatStoreMapCache.save("assistant-31", storeMap);

    const [user, assistant, other] = restoreCachedStoreMaps([
      message("user-30", "user"),
      message("assistant-31", "assistant"),
      message("assistant-33", "assistant"),
    ]);

    expect(user.storeMap).toBeUndefined();
    expect(assistant.storeMap).toEqual(storeMap);
    expect(other.storeMap).toBeUndefined();
  });

  it("keeps only the latest entries", () => {
    for (let index = 0; index < 55; index += 1) {
      chatStoreMapCache.save(`assistant-${index}`, storeMap);
    }

    expect(chatStoreMapCache.get("assistant-0")).toBeUndefined();
    expect(chatStoreMapCache.get("assistant-54")).toEqual(storeMap);
  });
});
