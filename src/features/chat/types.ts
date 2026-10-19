// 상담 메시지·세션 타입은 entities/chat으로 옮겼다. 기존 import 경로 호환용 재내보내기.
import type { ChatProgressStage } from "@/entities/chat";
export type {
  ChatAction,
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

/** 스트리밍으로 받고 있는 답변. content가 비어 있으면 아직 진행 단계만 보여준다. */
export type ChatStreamingReply = {
  stage?: ChatProgressStage;
  content: string;
  /** 목록·표·카드를 받는 중이라 말풍선 안에 로딩 블록을 보여준다. */
  isPreparingBlock?: boolean;
};
