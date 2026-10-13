import type { ChatMessage } from "@/features/chat/types";

/**
 * 관리자에게 보낼 수 있는 답변인지.
 * 서버에 저장된 정상 답변만 보낸다. 실패 답변은 BE가 ANSWER_FAILED로 따로 모으고,
 * FE가 만든 안내(매장 안내 등)는 서버 메시지 id가 없다.
 */
export const canReportAnswer = (message: ChatMessage) =>
  message.role === "assistant" &&
  (message.status ?? "success") === "success" &&
  typeof message.serverMessageId === "number" &&
  message.serverMessageId > 0;
