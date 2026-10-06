export type ChatMessageRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  sources?: readonly ChatAnswerSource[];
  actions?: readonly ChatAction[];
  storeMap?: ChatStoreMap;
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

export type ChatStoreSummary = {
  id: string;
  name: string;
  address: string;
  businessHours?: string;
  consultServices?: string[];
  phone: string;
  providedServices?: string[];
  lat: number;
  lng: number;
  distanceText?: string;
};

export type ChatStoreMap = {
  activeServices?: string[];
  origin?: {
    lat: number;
    lng: number;
  };
  stores: ChatStoreSummary[];
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
