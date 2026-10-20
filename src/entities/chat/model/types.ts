/** 상담 메시지·세션 화면 모델과 BE 세션 응답. 채팅 화면과 매장 지도 연결이 함께 쓴다. */
import type { AnswerFeedback } from "@/entities/feedback/@x/chat";
export type ChatMessageRole = "user" | "assistant";
export type {
  ChatSendRequest,
  ChatMessageResponse,
  ChatStreamEvent,
  ChatAssistantStatus,
} from "@/entities/chat/api/apiTypes";

/**
 * 답변 메시지의 결과 상태. 응답 중(loading)은 메시지가 아니라 streamingReply로 보여준다.
 * - success: 정상 답변 (없으면 success로 본다. 예전에 저장된 메시지 호환)
 * - error: 답변 생성 실패 · 네트워크 오류
 * - stopped: 사용자가 답변 생성을 중단함
 * - pending: 기록을 열었을 때 아직 BE가 답변을 만들고 있음
 */
export type ChatAnswerStatus = "success" | "error" | "stopped" | "pending";

/** 답변 평가. 타입 정의는 entities/feedback에 있다. */
export type ChatFeedback = AnswerFeedback;

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  /** assistant 메시지에서만 쓴다. */
  status?: ChatAnswerStatus;
  sources?: readonly ChatAnswerSource[];
  /** POST가 제공하는 FAQ ID. 제목·본문은 현재 SSE/기록 계약에 없다. */
  relatedFaqIds?: readonly number[];
  actions?: readonly ChatAction[];
  plans?: readonly ChatPlan[];
  storeMap?: ChatStoreMap;
  /** BE 메시지 id. 서버에 저장된 답변에만 있고, 피드백 같은 메시지 단위 API에 쓴다. */
  serverMessageId?: number;
  /** 답변 도움 여부. 같은 값을 다시 누르면 BE에 null을 보내 취소한다. */
  feedback?: ChatFeedback | null;
};

export type ChatPlan = {
  planId?: number;
  planCode?: string;
  name: string;
  summary?: string;
  monthlyFee: number;
  description?: string;
  networkType?: string;
  targetGroup?: string;
  minAge?: number | null;
  maxAge?: number | null;
  dataPolicy?: string;
  baseDataMb?: number | null;
  exhaustedSpeedKbps?: number | null;
  voicePolicy?: string;
  voiceMinutes?: number | null;
  smsPolicy?: string;
  smsCount?: number | null;
};

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

/** 매장을 찾은 기준 위치가 어디서 왔는지. current: 브라우저 현재 위치, place: 질문에 나온 장소 기준, default: 예전 기본 위치 결과 호환. */
export type ChatStoreOriginSource = "current" | "place" | "default";

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
  /** place/default 기준일 때 사용자에게 보여줄 기준 이름. */
  originLabel?: string | null;
  stores: ChatStoreSummary[];
};

export type ChatApiMessageRole = "USER" | "ASSISTANT";

export type ChatApiMessageStatus =
  "PENDING" | "COMPLETED" | "FAILED" | "RETRYING";

/** 답변 생성 진행 단계. BE SSE의 assistant_status(thinking / retrieving_faq / generating)와 대응한다. */
export type ChatProgressStage = "understanding" | "retrieving" | "generating";

/**
 * 실시간 스트림으로 답변을 끝까지 받지 못해, 저장된 답변을 다시 조회(polling)하는 이유.
 * - disconnected: 답변 도중 스트림 연결이 끊김
 * - timeout: 연결은 살아 있지만 일정 시간 동안 답변이 끝나지 않음
 */
export type ChatAnswerRecovery = "disconnected" | "timeout";

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
  storeMap?: import("@/entities/chat/api/apiTypes").ChatApiStoreMap | null;
  actions?:
    readonly import("@/entities/chat/api/apiTypes").ChatApiAction[] | null;
  plans?: readonly import("@/entities/chat/api/apiTypes").ChatApiPlan[] | null;
};

export type SessionMessagesResponse = {
  sessionId: number;
  messages: SessionMessage[];
};
