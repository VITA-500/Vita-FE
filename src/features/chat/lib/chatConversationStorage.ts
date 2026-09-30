import type { ChatMessage } from "@/features/chat/types";

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

const createFallbackGuestId = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const randomValue = Math.floor(Math.random() * 16);
    const uuidValue = char === "x" ? randomValue : (randomValue & 0x3) | 0x8;

    return uuidValue.toString(16);
  });
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
