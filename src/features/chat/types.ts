export type ChatMessageRole = "user" | "assistant";

/**
 * 답변 메시지의 결과 상태. 응답 중(loading)은 메시지가 아니라 streamingReply로 보여준다.
 * - success: 정상 답변 (없으면 success로 본다. 예전에 저장된 메시지 호환)
 * - error: 답변 생성 실패 · 네트워크 오류
 * - stopped: 사용자가 답변 생성을 중단함
 * - pending: 기록을 열었을 때 아직 BE가 답변을 만들고 있음
 */
export type ChatAnswerStatus = "success" | "error" | "stopped" | "pending";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  /** assistant 메시지에서만 쓴다. */
  status?: ChatAnswerStatus;
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
