export type ChatMessageRole = "user" | "assistant";

/**
 * 답변 메시지의 결과 상태. 응답 중(loading)은 메시지가 아니라 streamingReply로 보여준다.
 * - success: 정상 답변 (없으면 success로 본다. 예전에 저장된 메시지 호환)
 * - error: 답변 생성 실패 · 네트워크 오류
 * - stopped: 사용자가 답변 생성을 중단함
 * - pending: 기록을 열었을 때 아직 BE가 답변을 만들고 있음
 */
export type ChatAnswerStatus = "success" | "error" | "stopped" | "pending";

export type ChatFeedback = "LIKE" | "DISLIKE";

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
  /** BE 메시지 id. 서버에 저장된 답변에만 있고, 피드백 같은 메시지 단위 API에 쓴다. */
  serverMessageId?: number;
  /** 답변 도움 여부. 같은 값을 다시 누르면 BE에 null을 보내 취소한다. */
  feedback?: ChatFeedback | null;
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

export type ChatStoreType = "PHONE" | "PARTNER";

export type ChatStoreSummary = {
  id: string;
  name: string;
  address: string;
  businessHours?: string;
  benefitBrand?: string;
  benefitCategory?: string;
  benefitDescription?: string;
  benefitId?: number;
  benefitName?: string;
  consultServices?: string[];
  /** BE openNow(조회 시점 기준). 예전에 저장된 답변에는 없을 수 있다. */
  openNow?: boolean;
  phone: string;
  providedServices?: string[];
  lat: number;
  lng: number;
  distanceText?: string;
};

/** 매장을 찾은 기준 위치가 어디서 왔는지. current: 브라우저 현재 위치, default: 위치를 못 받아 쓴 기본 위치. */
export type ChatStoreOriginSource = "current" | "default";

export type ChatStoreMap = {
  type?: ChatStoreType | null;
  category?: string | null;
  benefitId?: number | null;
  activeServices?: string[];
  origin?: {
    lat: number;
    lng: number;
  };
  /** 없으면(예전에 저장된 메시지·BE 응답) 실제 위치로 본다. */
  originSource?: ChatStoreOriginSource;
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
  /** 서버가 상담 고정 상태를 내려주면 사이드바 고정 영역에 반영한다. */
  pinned?: boolean;
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
  feedback?: ChatFeedback | null;
  storeMap?: ChatStoreMap | null;
  actions?: readonly ChatAction[] | null;
};

export type SessionMessagesResponse = {
  sessionId: number;
  messages: SessionMessage[];
};
