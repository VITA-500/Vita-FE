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

export type ChatApiMessageStatus =
  "PENDING" | "COMPLETED" | "FAILED" | "RETRYING";

/** 답변 생성 진행 단계. BE SSE의 assistant_status(thinking / retrieving_faq / generating)와 대응한다. */
export type ChatProgressStage = "understanding" | "retrieving" | "generating";

/** 스트리밍으로 받고 있는 답변. content가 비어 있으면 아직 진행 단계만 보여준다. */
export type ChatStreamingReply = {
  stage?: ChatProgressStage;
  content: string;
  /** 목록·표·카드를 받는 중이라 말풍선 안에 로딩 블록을 보여준다. */
  isPreparingBlock?: boolean;
};

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
  status?: ChatApiMessageStatus;
};

export type SessionMessagesResponse = {
  sessionId: number;
  messages: SessionMessage[];
};
