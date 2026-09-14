import { MapPin, Search, SquarePen, type LucideIcon } from "lucide-react";
import type { ChatAnswerSource, ChatMode } from "@/features/chat/types";
import { routes } from "@/shared/constants/routes";

export type ServiceMenu = {
  label: string;
  href?: string;
  icon: LucideIcon;
  mode?: ChatMode;
  disabled?: boolean;
};

export const serviceMenus: ServiceMenu[] = [
  {
    label: "새 상담",
    href: routes.chat,
    icon: SquarePen,
    mode: "chat",
  },
  {
    label: "매장 지도",
    href: `${routes.chat}?mode=store`,
    icon: MapPin,
    mode: "store",
  },
  {
    label: "검색",
    icon: Search,
    disabled: true,
  },
];

export const recentChats = [
  {
    title: "휴대폰 분실 신고 방법",
    active: false,
  },
  {
    title: "요금제 변경 문의",
    active: false,
  },
  {
    title: "가까운 매장 찾기",
    active: false,
  },
] as const;

export const suggestedPrompts = [
  {
    title: "휴대폰을 잃어버렸어요",
    prompt: "휴대폰을 잃어버렸어요. 지금 바로 해야 할 일을 알려줘.",
    description: "분실 신고와 유심 보호 방법을 안내해드려요.",
  },
  {
    title: "요금제를 변경하고 싶어요",
    prompt: "요금제를 변경하고 싶어요. 어떤 절차가 필요한가요?",
    description: "FAQ를 찾아 변경 절차와 확인사항을 정리해드려요.",
  },
  {
    title: "지금 근처 매장 찾아줘",
    prompt: "지금 근처 매장을 찾아줘.",
    description: "위치 권한을 확인한 뒤 채팅 안에서 지도로 보여드려요.",
  },
] as const;

export const mockFaqSources: Record<string, ChatAnswerSource[]> = {
  lostPhone: [
    {
      id: "faq-lost-001",
      title: "휴대폰 분실 시 회선 보호 및 신고 방법",
      category: "분실/보호",
    },
    {
      id: "faq-usim-002",
      title: "유심 재발급과 본인확인 준비 서류",
      category: "유심",
    },
  ],
  planChange: [
    {
      id: "faq-plan-001",
      title: "요금제 변경 가능 시점과 유의사항",
      category: "요금제",
    },
    {
      id: "faq-benefit-004",
      title: "약정/결합 할인 유지 조건",
      category: "혜택",
    },
  ],
  store: [
    {
      id: "store-guide-001",
      title: "가까운 매장 방문 전 확인사항",
      category: "매장",
    },
  ],
};

export const mockChatAnswers = [
  {
    matcher: "잃어버",
    answer:
      "먼저 회선 일시정지로 추가 사용을 막고, 유심 보호 신청을 함께 진행하는 것이 좋아요. 신분증을 준비하면 가까운 매장에서 유심 재발급도 상담받을 수 있어요.",
    sources: mockFaqSources.lostPhone,
  },
  {
    matcher: "분실",
    answer:
      "분실 상황이라면 회선 일시정지, 단말 위치 확인, 유심 재발급 가능 여부를 순서대로 확인하면 돼요. 본인 확인이 필요할 수 있으니 신분증을 챙겨주세요.",
    sources: mockFaqSources.lostPhone,
  },
  {
    matcher: "요금제",
    answer:
      "요금제 변경은 현재 약정, 결합 할인, 데이터 사용량을 함께 확인한 뒤 선택하는 게 좋아요. 변경 전에는 다음 달 청구 기준과 할인 유지 조건을 꼭 확인해 주세요.",
    sources: mockFaqSources.planChange,
  },
  {
    matcher: "매장",
    answer:
      "가까운 매장을 확인해드릴게요. 위치 기준 매장 목록에서 방문 가능한 지점을 고르고 길찾기를 바로 열 수 있어요.",
    sources: mockFaqSources.store,
    actions: [
      {
        label: "가까운 매장 보기",
        href: `${routes.chat}?mode=store`,
      },
    ],
  },
] as const;

export const CHAT_TOUR_STORAGE_KEY = "vita-chat-tour-seen";
