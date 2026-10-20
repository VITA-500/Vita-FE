"use client";

import type { ChatConversation } from "./chatPageTypes";
import { GuestNewChatDialog } from "@/features/chat/conversation/components/GuestNewChatDialog";
import { ChatSearchDialog } from "@/features/chat/search/components/ChatSearchDialog";
import { ChatSettingsPanel } from "@/features/chat/settings/components/ChatSettingsPanel";

type ChatPageDialogsProps = {
  conversation: ChatConversation;
  isGuestNewChatOpen: boolean;
  isSearchOpen: boolean;
  isSettingsOpen: boolean;
  onCloseGuestNewChat: () => void;
  onCloseSearch: () => void;
  onCloseSettings: () => void;
  onStartTour: () => void;
};

/** 상담 검색, 채팅 설정, 게스트 새 상담 확인 대화상자 */
export const ChatPageDialogs = ({
  conversation,
  isGuestNewChatOpen,
  isSearchOpen,
  isSettingsOpen,
  onCloseGuestNewChat,
  onCloseSearch,
  onCloseSettings,
  onStartTour,
}: ChatPageDialogsProps) => (
  <>
    <ChatSearchDialog
      chatSessions={conversation.chatSessions}
      currentChatTitle={conversation.currentChatTitle}
      currentSessionId={conversation.currentSessionId ?? null}
      isOpen={isSearchOpen}
      onClose={onCloseSearch}
      onSelectChat={(targetSessionId) => {
        void conversation.handleSelectChat(targetSessionId);
      }}
    />
    <ChatSettingsPanel
      isOpen={isSettingsOpen}
      onClose={onCloseSettings}
      onStartTour={onStartTour}
    />
    {isGuestNewChatOpen && (
      <GuestNewChatDialog
        onCancel={onCloseGuestNewChat}
        onConfirm={() => {
          conversation.startNewChat();
          onCloseGuestNewChat();
        }}
      />
    )}
  </>
);
