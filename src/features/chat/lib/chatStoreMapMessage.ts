import { stripStoreTablesFromAnswer } from "@/features/chat/lib/chatStoreAnswerContent";
import {
  hasRequestedServiceStoreMap,
  isPartnerStorePrompt,
} from "@/features/chat/lib/chatStoreMap";
import type { ChatMessage, ChatStoreMap } from "@/features/chat/types";

const isMismatchedPartnerStoreMap = (prompt: string, storeMap?: ChatStoreMap) =>
  isPartnerStorePrompt(prompt) &&
  Boolean(storeMap) &&
  storeMap?.type !== "PARTNER" &&
  !hasRequestedServiceStoreMap(storeMap);

const LOCATION_MISSING_LINE =
  /위치\s*정보.*없|위치.*확인.*못|위치.*허용|현재\s*위치.*알\s*수\s*없/;

const stripLocationMissingLines = (content: string) =>
  content
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => !LOCATION_MISSING_LINE.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const getPartnerStoreContent = (message: ChatMessage) =>
  stripLocationMissingLines(
    stripStoreTablesFromAnswer(message.content, message.storeMap),
  );

export const shouldCacheStoreMapForPrompt = (
  prompt: string,
  storeMap?: ChatStoreMap,
) => !isMismatchedPartnerStoreMap(prompt, storeMap);

export const normalizeStoreMapMessageForPrompt = (
  message: ChatMessage,
  prompt: string,
): ChatMessage => {
  if (isPartnerStorePrompt(prompt) && message.storeMap?.type === "PARTNER") {
    return {
      ...message,
      content: getPartnerStoreContent(message),
    };
  }

  if (!isMismatchedPartnerStoreMap(prompt, message.storeMap)) {
    return message;
  }

  return {
    ...message,
    content: getPartnerStoreContent(message),
    actions: undefined,
    storeMap: undefined,
  };
};
