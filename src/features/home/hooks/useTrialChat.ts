import type { FormEvent } from "react";
import { useRef, useState, useSyncExternalStore } from "react";

export type TrialMessage = {
  role: "user" | "assistant";
  content: string;
};

type TrialState = {
  usedCount: number;
  messages: TrialMessage[];
};

const TRIAL_STORAGE_KEY = "vita-trial-chat";
const TRIAL_UPDATE_EVENT = "vita-trial-chat-updated";
export const TRIAL_LIMIT = 5;

const defaultTrialState: TrialState = {
  usedCount: 0,
  messages: [],
};

const createTrialAnswer = (question: string) => {
  const normalizedQuestion = question.replace(/\s/g, "");

  if (/(분실|잃어|잃어버|잃었|유심)/.test(normalizedQuestion)) {
    return "휴대폰을 잃어버렸다면 먼저 분실 신고와 이용 정지를 진행하는 게 좋아요. 유심 보호 설정과 계정 비밀번호 변경도 같이 확인해드릴게요.";
  }

  if (/(요금|요금제|할인|납부|청구)/.test(normalizedQuestion)) {
    return "요금제 변경은 현재 사용량, 약정 여부, 할인 조건을 먼저 확인해야 해요. 원하시면 변경 전 체크할 항목을 순서대로 정리해드릴게요.";
  }

  if (/(매장|위치|가까|방문|지도)/.test(normalizedQuestion)) {
    return "현재 위치를 기준으로 가까운 매장을 찾을 수 있어요. 영업 여부, 거리, 방문 전에 준비할 내용까지 함께 안내해드릴게요.";
  }

  if (/(로밍|해외|여행)/.test(normalizedQuestion)) {
    return "해외 로밍은 방문 국가, 이용 기간, 데이터 사용량에 따라 선택지가 달라져요. 출국 전 설정과 요금 확인 순서부터 안내해드릴게요.";
  }

  return "질문 내용을 기준으로 관련 FAQ를 찾아 필요한 정보만 간단히 정리해드릴게요. 더 구체적인 상황을 알려주시면 답변도 더 정확해져요.";
};

const loadTrialState = () => {
  if (typeof window === "undefined") {
    return defaultTrialState;
  }

  try {
    const savedState = window.localStorage.getItem(TRIAL_STORAGE_KEY);

    if (!savedState) {
      return defaultTrialState;
    }

    const parsedState = JSON.parse(savedState) as {
      usedCount?: unknown;
      messages?: unknown;
    };
    const usedCount =
      typeof parsedState.usedCount === "number" ? parsedState.usedCount : 0;
    const messages = Array.isArray(parsedState.messages)
      ? parsedState.messages.filter(
          (message): message is TrialMessage =>
            typeof message === "object" &&
            message !== null &&
            "role" in message &&
            "content" in message &&
            (message.role === "user" || message.role === "assistant") &&
            typeof message.content === "string",
        )
      : [];

    return {
      usedCount: Math.min(Math.max(usedCount, 0), TRIAL_LIMIT),
      messages: messages.slice(-10),
    };
  } catch {
    return defaultTrialState;
  }
};

const readTrialSnapshot = () => JSON.stringify(loadTrialState());
const getServerTrialSnapshot = () => JSON.stringify(defaultTrialState);

const subscribeTrialState = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(TRIAL_UPDATE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(TRIAL_UPDATE_EVENT, callback);
  };
};

const saveTrialState = (usedCount: number, messages: TrialMessage[]) => {
  try {
    window.localStorage.setItem(
      TRIAL_STORAGE_KEY,
      JSON.stringify({ usedCount, messages }),
    );
    window.dispatchEvent(new Event(TRIAL_UPDATE_EVENT));
  } catch {
    return;
  }
};

export const useTrialChat = () => {
  const trialSnapshot = useSyncExternalStore(
    subscribeTrialState,
    readTrialSnapshot,
    getServerTrialSnapshot,
  );
  const [question, setQuestion] = useState("");
  const [isTrialOpen, setIsTrialOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trialState = JSON.parse(trialSnapshot) as TrialState;

  const usedCount = Math.min(trialState.usedCount, TRIAL_LIMIT);
  const messages = trialState.messages.slice(-10);
  const remainingCount = Math.max(TRIAL_LIMIT - usedCount, 0);
  const isLimitReached = remainingCount === 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isLimitReached) {
      return;
    }

    const nextUsedCount = Math.min(usedCount + 1, TRIAL_LIMIT);
    const nextMessages = [
      ...messages,
      {
        role: "user" as const,
        content: trimmedQuestion,
      },
      {
        role: "assistant" as const,
        content: createTrialAnswer(trimmedQuestion),
      },
    ].slice(-10);

    setQuestion("");
    saveTrialState(nextUsedCount, nextMessages);
  };

  const openTrial = () => {
    setIsTrialOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  return {
    inputRef,
    isLimitReached,
    isTrialOpen,
    messages,
    question,
    remainingCount,
    handleSubmit,
    openTrial,
    setIsTrialOpen,
    setQuestion,
  };
};
