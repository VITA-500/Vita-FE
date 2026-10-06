import { createElement } from "react";
import {
  Baby,
  BadgePercent,
  BookOpen,
  Car,
  Clapperboard,
  Coffee,
  Croissant,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Hotel,
  House,
  Music,
  PawPrint,
  Plane,
  Shirt,
  ShoppingBag,
  Sparkles,
  Store,
  Ticket,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/** 제휴 혜택 카테고리 이름의 키워드로 아이콘을 고른다. 위에서부터 먼저 맞는 규칙을 쓴다. */
const benefitCategoryIconRules: { icon: LucideIcon; keywords: string[] }[] = [
  { icon: Clapperboard, keywords: ["영화", "시네마", "극장", "movie"] },
  {
    icon: Ticket,
    keywords: ["공연", "전시", "문화", "티켓", "테마파크", "놀이"],
  },
  { icon: Coffee, keywords: ["카페", "커피", "음료", "디저트", "cafe"] },
  { icon: Croissant, keywords: ["베이커리", "빵", "제과"] },
  {
    icon: UtensilsCrossed,
    keywords: ["외식", "음식", "식당", "푸드", "레스토랑", "food"],
  },
  { icon: Store, keywords: ["편의점", "마트"] },
  { icon: ShoppingBag, keywords: ["쇼핑", "백화점", "아울렛", "shopping"] },
  { icon: Shirt, keywords: ["패션", "의류"] },
  { icon: Sparkles, keywords: ["뷰티", "화장품", "미용"] },
  { icon: Plane, keywords: ["여행", "항공", "해외"] },
  { icon: Hotel, keywords: ["숙박", "호텔", "리조트"] },
  { icon: Car, keywords: ["자동차", "주유", "주차", "모빌리티", "렌터카"] },
  { icon: GraduationCap, keywords: ["교육", "학원", "강의"] },
  { icon: BookOpen, keywords: ["도서", "서점", "책"] },
  { icon: Gamepad2, keywords: ["게임"] },
  { icon: Music, keywords: ["음악", "스트리밍"] },
  { icon: Dumbbell, keywords: ["스포츠", "운동", "피트니스", "헬스"] },
  { icon: HeartPulse, keywords: ["건강", "병원", "의료", "약국"] },
  { icon: Baby, keywords: ["키즈", "육아", "유아"] },
  { icon: PawPrint, keywords: ["반려", "펫"] },
  { icon: House, keywords: ["생활", "리빙", "홈"] },
];

export const getBenefitCategoryIcon = (category?: string): LucideIcon => {
  const normalizedCategory = (category ?? "").replace(/\s/g, "").toLowerCase();

  if (!normalizedCategory) {
    return BadgePercent;
  }

  return (
    benefitCategoryIconRules.find(({ keywords }) =>
      keywords.some((keyword) => normalizedCategory.includes(keyword)),
    )?.icon ?? BadgePercent
  );
};

/**
 * 카테고리 아이콘 요소를 만든다. 렌더 중에 아이콘 컴포넌트를 변수로 받아 <Icon />으로 그리면
 * react-hooks/static-components 규칙에 걸리므로, 요소로 만들어 넘긴다.
 */
export const renderBenefitCategoryIcon = (
  category: string | undefined,
  size: number,
) =>
  createElement(getBenefitCategoryIcon(category), {
    "aria-hidden": true,
    size,
  });
