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

export type ChatApiMessageRole = "USER" | "ASSISTANT";

export type ChatSessionSummary = {
  sessionId: number;
  title: string | null;
  updatedAt: string;
};

export type ChatSessionListResponse = {
  sessions: ChatSessionSummary[];
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
