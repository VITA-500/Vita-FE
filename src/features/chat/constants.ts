import { MapPin, SquarePen, type LucideIcon } from "lucide-react";
import type { ChatMode } from "@/features/chat/types";
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

export const CHAT_TOUR_STORAGE_KEY = "vita-chat-tour-seen";
