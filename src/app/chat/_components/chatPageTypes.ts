import type { useChatConversationController } from "@/features/chat";

/** 채팅 화면 조립 컴포넌트가 함께 쓰는 대화 상태(useChatConversationController 결과) */
export type ChatConversation = ReturnType<typeof useChatConversationController>;
