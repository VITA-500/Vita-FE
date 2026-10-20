import {
  isPartnerStorePrompt,
  isStoreRelatedPrompt,
} from "@/features/chat/store/lib/chatStoreMap";
import type { ChatMessage } from "@/features/chat/types";

/** 답변 아래에 보여주는 후속 제안. 버튼을 누르면 prompt를 그대로 질문으로 보낸다. */
export type ChatFollowUp = {
  /** 이어서 도와줄 수 있는 일을 알려주는 한 문장 ("~도 있어요. ~도 도와드릴까요?") */
  intro: string;
  prompts: string[];
};

const MAX_PROMPTS = 3;

/** 요금제 변경·가입처럼 매장에서도 처리할 수 있는 질문 */
const ACCOUNT_CHANGE_PATTERN =
  /변경|가입|해지|개통|번호\s*이동|명의|기기\s*변경/;

const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

type FollowUpRule = {
  matches: (input: { answer: ChatMessage; question: string }) => boolean;
  build: (input: { answer: ChatMessage; question: string }) => ChatFollowUp;
};

/**
 * 패턴 순서가 우선순위다. 답변에 실제로 들어온 데이터(매장 지도, 요금제 카드)를 먼저 보고,
 * 없으면 질문 내용으로 판단한다. 어느 것에도 맞지 않으면 제안을 보여주지 않는다.
 */
const followUpRules: FollowUpRule[] = [
  {
    matches: ({ answer }) => Boolean(answer.storeMap?.stores.length),
    build: () => ({
      intro: "가까운 매장을 찾았어요. 방문 전에 이것도 도와드릴까요?",
      prompts: [
        "지금 영업 중인 매장만 알려줘",
        "매장 방문 예약은 어떻게 해?",
        "매장에 갈 때 챙겨야 할 게 있어?",
      ],
    }),
  },
  {
    matches: ({ answer }) => Boolean(answer.plans?.length),
    build: ({ answer }) => {
      const [first, second] = answer.plans ?? [];

      return {
        intro:
          "추천한 요금제 말고도 비교해 볼 만한 게 있어요. 이것도 도와드릴까요?",
        prompts: [
          second
            ? `${first.name}와 ${second.name} 차이를 비교해줘`
            : `${first.name}와 비슷한 다른 요금제도 알려줘`,
          "요금제 변경은 어떻게 해?",
          "가까운 매장에서 요금제 상담받고 싶어",
        ],
      };
    },
  },
  {
    matches: ({ question }) =>
      ACCOUNT_CHANGE_PATTERN.test(question) && !isStoreRelatedPrompt(question),
    build: () => ({
      intro:
        "온라인 말고 매장에서 바로 처리할 수도 있어요. 가까운 매장도 찾아드릴까요?",
      prompts: ["가까운 매장 찾아줘", "매장 방문할 때 필요한 준비물 알려줘"],
    }),
  },
  {
    matches: ({ question }) =>
      isPartnerStorePrompt(question) && !isStoreRelatedPrompt(question),
    build: () => ({
      intro: "이 혜택을 쓸 수 있는 매장도 있어요. 함께 찾아드릴까요?",
      prompts: ["근처 제휴 매장 찾아줘"],
    }),
  },
];

/**
 * 성공한 답변 하나에 붙일 후속 제안을 고른다.
 * 같은 상담에서 이미 물어본 질문은 다시 제안하지 않고, 남는 제안이 없으면 null을 돌려준다.
 */
export const getChatFollowUp = ({
  answer,
  askedPrompts,
  question,
}: {
  answer: ChatMessage;
  /** 이 상담에서 사용자가 보낸 질문들 */
  askedPrompts: readonly string[];
  /** 이 답변을 만든 질문 */
  question: string;
}): ChatFollowUp | null => {
  // 실패·중단·준비 중 답변에는 다시 시도 버튼 등이 따로 있어 제안을 붙이지 않는다.
  if (answer.role !== "assistant") return null;
  if (answer.status && answer.status !== "success") return null;

  const input = { answer, question };
  const rule = followUpRules.find((candidate) => candidate.matches(input));

  if (!rule) return null;

  const asked = new Set(askedPrompts.map(normalize));
  const followUp = rule.build(input);
  const prompts = followUp.prompts
    .filter((prompt) => !asked.has(normalize(prompt)))
    .slice(0, MAX_PROMPTS);

  return prompts.length ? { ...followUp, prompts } : null;
};
