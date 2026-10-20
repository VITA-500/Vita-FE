"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ChatStoreMap } from "@/entities/chat";

type RenderChatStoreMap = (storeMap: ChatStoreMap) => ReactNode;

const ChatStoreMapSlotContext = createContext<RenderChatStoreMap | null>(null);

/**
 * 답변 속 매장 지도 자리. 매장 지도(지도 미리보기·예약 모달)는 store feature라서 채팅이 직접 import하지 않고,
 * 화면을 조립하는 app/chat에서 그리는 방법을 넘겨준다(docs/Architecture.md: feature 간 직접 import 금지).
 * 넘겨주지 않으면(Storybook 등) 지도 블록 없이 답변만 보인다.
 */
export const ChatStoreMapSlotProvider = ({
  children,
  renderStoreMap,
}: {
  children: ReactNode;
  renderStoreMap: RenderChatStoreMap;
}) => (
  <ChatStoreMapSlotContext.Provider value={renderStoreMap}>
    {children}
  </ChatStoreMapSlotContext.Provider>
);

export const useChatStoreMapSlot = () => useContext(ChatStoreMapSlotContext);
