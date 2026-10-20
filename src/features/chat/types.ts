// 상담 메시지·세션 타입은 entities/chat으로 옮겼다. 기존 import 경로 호환용 재내보내기.
import type { ChatAnswerRecovery, ChatProgressStage } from "@/entities/chat";
export type {
  ChatAction,
  ChatAnswerRecovery,
  ChatAnswerSource,
  ChatAnswerStatus,
  ChatApiMessageRole,
  ChatApiMessageStatus,
  ChatAssistantStatus,
  ChatFeedback,
  ChatMessage,
  ChatMessageResponse,
  ChatMessageRole,
  ChatPlan,
  ChatProgressStage,
  ChatSendRequest,
  ChatSessionListResponse,
  ChatSessionSummary,
  ChatStoreMap,
  ChatStoreOriginSource,
  ChatStoreSummary,
  ChatStoreType,
  ChatStreamEvent,
  SessionMessage,
  SessionMessagesResponse,
} from "@/entities/chat";

export type ChatConversationStatus =
  | "idle"
  | "loading"
  | "thinking"
  | "retrieving_faq"
  | "generating"
  | "done"
  | "failed"
  | "expired";

export type ChatStatus = "idle" | "loading" | "success" | "error";

export type ChatMode = "chat" | "profile" | "store";

/** 매장 질문에서 답변 요청 전에 위치를 확인하는 상태 */
export type ChatLocationStatus = "locating" | "located" | "unavailable";

/** 스트리밍으로 받고 있는 답변. content가 비어 있으면 아직 진행 단계만 보여준다. */
export type ChatStreamingReply = {
  stage?: ChatProgressStage;
  content: string;
  /** 목록·표·카드를 받는 중이라 말풍선 안에 로딩 블록을 보여준다. */
  isPreparingBlock?: boolean;
  /** 스트림이 끊기거나 늦어져 저장된 답변을 다시 불러오는 중이면 그 이유 */
  recovery?: ChatAnswerRecovery;
  /** 매장 질문이면 true. 검색 단계 문구를 매장 기준으로 바꾼다. */
  isStorePrompt?: boolean;
  /** 매장 질문의 위치 확인 상태. 매장 질문이 아니면 없다. */
  location?: ChatLocationStatus;
};
