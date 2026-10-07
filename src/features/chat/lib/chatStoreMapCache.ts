import type { ChatMessage, ChatStoreMap } from "@/features/chat/types";

/**
 * 답변에 붙은 매장 지도(storeMap)를 메시지 id별로 브라우저에 보관한다.
 *
 * BE 기록 조회(GET /chat/sessions/{id}/messages)에는 storeMap이 없어서, 다른 상담을 열었다가
 * 돌아오면 지도 블록이 사라졌다. 기록을 불러올 때 같은 메시지 id의 지도를 다시 붙인다.
 * 이 브라우저에서 본 답변만 복원된다. BE가 기록 조회에 storeMap을 내려주면 이 캐시는 필요 없다.
 */

const STORAGE_KEY = "vita-chat-store-maps";
/** 오래된 것부터 지워 저장소가 커지지 않게 한다. */
const MAX_ENTRIES = 50;

type StoreMapCacheEntry = { messageId: string; storeMap: ChatStoreMap };

const readEntries = (): StoreMapCacheEntry[] => {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    ) as unknown;

    return Array.isArray(parsed)
      ? parsed.filter(
          (entry): entry is StoreMapCacheEntry =>
            typeof entry?.messageId === "string" &&
            Array.isArray(entry?.storeMap?.stores),
        )
      : [];
  } catch {
    return [];
  }
};

export const chatStoreMapCache = {
  save: (messageId: string, storeMap: ChatStoreMap) => {
    const entries = readEntries().filter(
      (entry) => entry.messageId !== messageId,
    );

    entries.push({ messageId, storeMap });

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(entries.slice(-MAX_ENTRIES)),
      );
    } catch {
      // 저장소를 쓸 수 없으면(사생활 보호 모드 등) 복원만 안 될 뿐 화면에는 영향 없다.
    }
  },
  get: (messageId: string) =>
    readEntries().find((entry) => entry.messageId === messageId)?.storeMap,
};

/** 서버 기록으로 불러온 답변에 보관해 둔 매장 지도를 다시 붙인다. */
export const restoreCachedStoreMaps = (messages: ChatMessage[]) =>
  messages.map((message) => {
    if (message.role !== "assistant" || message.storeMap) return message;

    const storeMap = chatStoreMapCache.get(message.id);

    return storeMap ? { ...message, storeMap } : message;
  });
