import type {
  ChatAnswerSource,
  ChatMessage,
  ChatSessionListResponse,
  SessionMessagesResponse,
} from "@/features/chat/types";
import { requestJson } from "@/shared/api/http";
import { env } from "@/shared/config/env";

type ChatSessionCreateResponse = {
  sessionId: number;
  createdAt: string;
};

type ChatMessageResponse = {
  messageId: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "RETRYING";
  answer: string;
  relatedFaqIds: number[];
  createAt: string;
  latencyMs: number;
};

type SendChatMessageOptions = {
  content: string;
  guestId?: string;
  sessionId: number;
};

const guestHeaders = (guestId?: string) =>
  guestId ? { "X-Guest-Id": guestId } : undefined;

const createChatApiUrl = (path: string) => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${env.apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const requestGuestChatJson = async <T>(
  path: string,
  guestId: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(createChatApiUrl(path), {
    ...options,
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      "X-Guest-Id": guestId,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      errorBody?.message ?? `Chat API failed: ${response.status}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
};

const toAssistantMessage = (response: ChatMessageResponse): ChatMessage => {
  const sources: ChatAnswerSource[] = response.relatedFaqIds.map((faqId) => ({
    id: String(faqId),
    title: `FAQ #${faqId}`,
    category: "FAQ",
  }));

  return {
    id: `assistant-${response.messageId}`,
    role: "assistant",
    content: response.answer,
    createdAt: response.createAt,
    sources,
  };
};

export const chatService = {
  claimGuestSession: (sessionId: number, guestId: string) => {
    return requestJson<{ sessionId: number; claimedAt: string }>(
      `/chat/sessions/${sessionId}/claim`,
      {
        method: "POST",
        headers: guestHeaders(guestId),
      },
    );
  },
  createSession: (guestId?: string) => {
    if (guestId) {
      return requestGuestChatJson<ChatSessionCreateResponse>(
        "/chat/sessions",
        guestId,
        {
          method: "POST",
        },
      );
    }

    return requestJson<ChatSessionCreateResponse>("/chat/sessions", {
      method: "POST",
      headers: guestHeaders(guestId),
    });
  },
  getMessages: (sessionId: number) => {
    return requestJson<SessionMessagesResponse>(
      `/chat/sessions/${sessionId}/messages`,
    );
  },
  getSessions: () => {
    return requestJson<ChatSessionListResponse>("/chat/sessions");
  },
  sendMessage: async ({
    content,
    guestId,
    sessionId,
  }: SendChatMessageOptions) => {
    const path = `/chat/sessions/${sessionId}/messages`;
    const response = guestId
      ? await requestGuestChatJson<ChatMessageResponse>(path, guestId, {
          method: "POST",
          body: JSON.stringify({ content }),
          signal: AbortSignal.timeout(45000),
        })
      : await requestJson<ChatMessageResponse>(path, {
          method: "POST",
          body: JSON.stringify({ content }),
          timeoutMs: 45000,
        });

    return toAssistantMessage(response);
  },
};
