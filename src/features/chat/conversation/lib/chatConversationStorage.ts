import type { ChatMessage } from "@/entities/chat";

export type StoredChatConversation = {
  guestId?: string;
  messages: ChatMessage[];
  sessionId?: number;
  title: string;
};

const CHAT_CONVERSATION_KEY_PREFIX = "vita-chat-conversation";
const GUEST_OWNER_KEY = "guest";
const GUEST_BACKUP_OWNER_KEY = "guest-backup";

const getStorageKey = (ownerKey: string) =>
  `${CHAT_CONVERSATION_KEY_PREFIX}:${ownerKey}`;

export const getChatConversationOwnerKey = (
  user?: { userId: number } | null,
) => {
  return user ? `user:${user.userId}` : GUEST_OWNER_KEY;
};

export const getGuestChatConversationOwnerKey = () => GUEST_OWNER_KEY;

const isStoredChatConversation = (
  value: unknown,
): value is StoredChatConversation => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StoredChatConversation>;

  return (
    typeof candidate.title === "string" && Array.isArray(candidate.messages)
  );
};

/**
 * randomUUID가 없는 환경(HTTP 접속, 오래된 브라우저)용 UUID v4.
 * guestId는 게스트 상담을 여는 열쇠라 Math.random(예측 가능) 대신 암호학적 난수를 쓴다.
 */
const createFallbackGuestId = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const createGuestId = () => {
  return window.crypto?.randomUUID?.() ?? createFallbackGuestId();
};

export const chatConversationStorage = {
  clear: (ownerKey: string) => {
    window.localStorage.removeItem(getStorageKey(ownerKey));

    if (ownerKey === GUEST_OWNER_KEY) {
      window.localStorage.removeItem(getStorageKey(GUEST_BACKUP_OWNER_KEY));
    }
  },
  load: (ownerKey: string): StoredChatConversation | null => {
    const rawValue = window.localStorage.getItem(getStorageKey(ownerKey));

    if (!rawValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as unknown;

      return isStoredChatConversation(parsedValue) ? parsedValue : null;
    } catch {
      return null;
    }
  },
  migrateGuestToUser: (ownerKey: string) => {
    if (ownerKey === GUEST_OWNER_KEY) {
      return null;
    }

    const guestConversation = chatConversationStorage.load(GUEST_OWNER_KEY);

    if (!guestConversation?.messages.length) {
      return null;
    }

    chatConversationStorage.save(ownerKey, guestConversation);
    chatConversationStorage.clear(GUEST_OWNER_KEY);
    chatConversationStorage.clear(GUEST_BACKUP_OWNER_KEY);

    return guestConversation;
  },
  loadGuestBackup: () => {
    return chatConversationStorage.load(GUEST_BACKUP_OWNER_KEY);
  },
  save: (ownerKey: string, conversation: StoredChatConversation) => {
    if (conversation.messages.length === 0 && !conversation.title) {
      chatConversationStorage.clear(ownerKey);
      return;
    }

    window.localStorage.setItem(
      getStorageKey(ownerKey),
      JSON.stringify(conversation),
    );

    if (ownerKey === GUEST_OWNER_KEY) {
      window.localStorage.setItem(
        getStorageKey(GUEST_BACKUP_OWNER_KEY),
        JSON.stringify(conversation),
      );
    }
  },
};
