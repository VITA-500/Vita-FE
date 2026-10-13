import type { ChatMessage } from "@/features/chat/types";

/**
 * BE 프롬프트 규칙 1의 안내 문구("해당 정보는 확인이 어렵습니다. 고객센터로 문의해주세요.").
 * 근거 자료가 없어 답하지 못한 답변을 알아보는 임시 기준이다.
 * BE가 미해결 여부(unresolvedReason)를 응답에 실어 주면 그 값으로 바꾼다.
 */
const UNRESOLVED_ANSWER_PATTERN = /해당\s*정보는\s*확인이\s*어렵습니다/;

/** 근거가 없어 답하지 못한 답변인지. 관리자에게 보내기를 눈에 띄게 보여줄 때 쓴다. */
export const isUnresolvedAnswer = (message: ChatMessage) =>
  message.role === "assistant" &&
  UNRESOLVED_ANSWER_PATTERN.test(message.content);

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
