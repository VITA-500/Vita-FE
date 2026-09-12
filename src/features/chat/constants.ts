import {
  MapPin,
  Search,
  SquarePen,
  type LucideIcon,
} from "lucide-react";
import { routes } from "@/shared/constants/routes";

export type ServiceMenu = {
  label: string;
  href?: string;
  icon: LucideIcon;
  active: boolean;
  disabled?: boolean;
};

export const serviceMenus: ServiceMenu[] = [
  {
    label: "새 상담",
    href: routes.chat,
    icon: SquarePen,
    active: true,
  },
  {
    label: "매장 지도",
    icon: MapPin,
    active: false,
    disabled: true,
  },
  {
    label: "검색",
    icon: Search,
    active: false,
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
    description: "분실 신고와 유심 보호 방법을 안내해드려요.",
  },
  {
    title: "요금제를 변경하고 싶어요",
    description: "FAQ를 찾아 변경 절차와 확인사항을 정리해드려요.",
  },
  {
    title: "지금 근처 매장 찾아줘",
    description: "위치 권한을 확인한 뒤 채팅 안에서 지도로 보여드려요.",
  },
] as const;

export const CHAT_TOUR_STORAGE_KEY = "vita-chat-tour-seen";
