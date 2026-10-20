// 상담 entity 공개 API. 외부에서는 이 파일로만 import한다(docs/Architecture.md).
export { chatApi, isPermanentClaimError } from "@/entities/chat/api/chatApi";
export {
  createChatApiUrl,
  guestHeaders,
  requestChatJson,
  requestGuestChatJson,
} from "@/entities/chat/api/chatApiClient";
export type { SendChatMessageOptions } from "@/entities/chat/api/chatStream";
export { ChatAnswerTimeoutError } from "@/entities/chat/api/chatStreamTransport";
export { parseStreamEvent } from "@/entities/chat/api/chatStreamEvent";
export type {
  ChatApiAction,
  ChatApiPlan,
  ChatApiStore,
  ChatApiStoreMap,
  ChatAssistantStatus,
  ChatMessageResponse,
  ChatSendRequest,
  ChatStreamEvent,
} from "@/entities/chat/api/apiTypes";
export {
  FAILED_ANSWER_MESSAGE,
  PENDING_ANSWER_MESSAGE,
  toAssistantMessage,
} from "@/entities/chat/model/chatAnswerMessage";
export {
  toChatPlan,
  toChatStoreMap,
} from "@/entities/chat/model/chatResponseAdapters";
export type {
  ChatAction,
  ChatAnswerSource,
  ChatAnswerStatus,
  ChatApiMessageRole,
  ChatApiMessageStatus,
  ChatFeedback,
  ChatMessage,
  ChatMessageRole,
  ChatPlan,
  ChatAnswerRecovery,
  ChatProgressStage,
  ChatSessionListResponse,
  ChatSessionSummary,
  ChatStoreMap,
  ChatStoreOriginSource,
  ChatStoreSummary,
  ChatStoreType,
  SessionMessage,
  SessionMessagesResponse,
} from "@/entities/chat/model/types";
