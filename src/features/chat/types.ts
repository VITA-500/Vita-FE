export type ChatMessageRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  sources?: readonly ChatAnswerSource[];
  actions?: readonly ChatAction[];
};

export type ChatStatus = "idle" | "loading" | "success" | "error";

export type ChatAnswerSource = {
  id: string;
  title: string;
  category: string;
};

export type ChatAction = {
  label: string;
  href: string;
};

export type ChatMode = "chat" | "profile" | "store";

/* ---------- Chat API (BE: /chat/sessions) ---------- */

export type ChatApiMessageRole = "USER" | "ASSISTANT";

export type ChatApiMessageStatus =
  "PENDING" | "COMPLETED" | "FAILED" | "RETRYING";

export type ChatSessionCreateResponse = {
  sessionId: number;
  createdAt: string;
};

export type ChatSessionSummary = {
  sessionId: number;
  title: string | null;
  updatedAt: string;
};

export type ChatSessionListResponse = {
  sessions: ChatSessionSummary[];
};

export type ChatSessionClaimResponse = {
  sessionId: number;
  claimedAt: string;
};

/** POST /chat/sessions/{id}/messages 응답 (BE 필드명 createAt 그대로) */
export type ChatMessageApiResponse = {
  messageId: number;
  status: ChatApiMessageStatus;
  answer: string | null;
  relatedFaqIds: number[];
  createAt: string;
  latencyMs: number;
};

export type SessionMessage = {
  messageId: number;
  role: ChatApiMessageRole;
  content: string | null;
  createdAt: string;
};

export type SessionMessagesResponse = {
  sessionId: number;
  messages: SessionMessage[];
};
