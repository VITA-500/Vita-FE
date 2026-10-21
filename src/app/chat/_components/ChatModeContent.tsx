"use client";

import { ChatStoreMap } from "./ChatStoreMap";
import type { ChatConversation } from "./chatPageTypes";
import { ProfilePanel } from "@/features/auth/components/ProfilePanel";
import { ChatConversationContent } from "@/features/chat/conversation/components/ChatConversationContent";
import { ChatStoreMapSlotProvider } from "@/features/chat/store/components/ChatStoreMapSlot";
import type { ChatMode } from "@/features/chat/types";
import { StoreMapPanel } from "@/widgets/store-map-panel/StoreMapPanel";
import type { StoreMapInitialAction } from "@/features/store/types";
import type { ChatStoreMap as ChatStoreMapData } from "@/entities/chat";

/** 답변 속 매장 지도 블록. 채팅(feature)과 매장 지도(feature)를 여기서 조립한다. */
const renderChatStoreMap = (storeMap: ChatStoreMapData, question?: string) => (
  <ChatStoreMap storeMap={storeMap} question={question} />
);

type ChatModeContentProps = {
  activeMode: ChatMode;
  conversation: ChatConversation;
  isAuthenticated: boolean;
  onOpenSidebar: () => void;
  storeMapInitialAction: StoreMapInitialAction | null;
};

/** 화면 모드(?mode=)에 따라 매장 지도 / 마이페이지 / 대화 화면을 보여준다. */
export const ChatModeContent = ({
  activeMode,
  conversation,
  isAuthenticated,
  onOpenSidebar,
  storeMapInitialAction,
}: ChatModeContentProps) => {
  if (activeMode === "store") {
    return (
      <div className="min-h-0 flex-1 overflow-hidden">
        <StoreMapPanel
          initialAction={storeMapInitialAction}
          onOpenSidebar={onOpenSidebar}
        />
      </div>
    );
  }

  if (activeMode === "profile") {
    return (
      <div className="min-h-0 flex-1 overflow-hidden">
        <ProfilePanel />
      </div>
    );
  }

  const { sendAnswerFeedback, submitChatPrompt } = conversation;

  return (
    <ChatStoreMapSlotProvider renderStoreMap={renderChatStoreMap}>
      <ChatConversationContent
        chatInput={conversation.chatInput}
        chatInputRef={conversation.chatInputRef}
        chatStatus={conversation.chatStatus}
        editHintMessageId={conversation.editHintMessageId}
        hasChatStarted={conversation.hasChatStarted}
        loadingSessionId={conversation.loadingSessionId}
        messages={conversation.messages}
        onChatInputChange={conversation.setChatInput}
        onEditPrompt={conversation.editAndResubmitPrompt}
        // 답변 피드백은 회원만 남길 수 있다. 비로그인이면 버튼 자체를 보여주지 않는다.
        onFeedbackAnswer={
          isAuthenticated
            ? (assistantMessageId, feedback, comment) =>
                void sendAnswerFeedback(assistantMessageId, feedback, comment)
            : undefined
        }
        onRetryAnswer={conversation.retryAnswer}
        feedbackMessageIds={conversation.feedbackMessageIds}
        onStopAnswer={conversation.stopChatAnswer}
        onSelectQuickAction={(prompt) => {
          void submitChatPrompt(prompt);
        }}
        onSubmitPrompt={(prompt) => void submitChatPrompt(prompt)}
        scrollContainerRef={conversation.scrollContainerRef}
        streamingReply={conversation.streamingReply}
      />
    </ChatStoreMapSlotProvider>
  );
};
