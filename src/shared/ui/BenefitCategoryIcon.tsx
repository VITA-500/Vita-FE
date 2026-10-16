import {
  BadgePercent,
  Car,
  Clapperboard,
  Coffee,
  ShoppingBag,
  Store,
  Ticket,
  UtensilsCrossed,
} from "lucide-react";

const rules = [
  [Clapperboard, ["영화", "시네마", "극장"]],
  [Ticket, ["공연", "전시", "문화", "티켓", "놀이"]],
  [Coffee, ["카페", "커피", "음료", "디저트"]],
  [UtensilsCrossed, ["외식", "음식", "식당", "푸드"]],
  [ShoppingBag, ["쇼핑", "백화점", "아울렛"]],
  [Car, ["자동차", "주유", "주차"]],
  [Store, ["편의점", "마트"]],
] as const;

export const renderBenefitCategoryIcon = (
  category: string | undefined,
  size: number,
) => {
  const normalized = (category ?? "").replace(/\s/g, "").toLowerCase();
  const Icon =
    rules.find(([, keywords]) =>
      keywords.some((keyword) => normalized.includes(keyword)),
    )?.[0] ?? BadgePercent;
  return <Icon aria-hidden size={size} />;
};
