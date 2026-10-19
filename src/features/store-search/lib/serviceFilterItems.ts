import {
  BadgePercent,
  CardSim,
  Headset,
  Link2,
  Phone,
  Plane,
  ReceiptText,
  RefreshCcw,
  Smartphone,
  Tag,
  Tv,
  UserPlus,
  Wallet,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  getServiceFilterColor,
  type ServiceFilterOption,
} from "@/features/store/lib/markerColors";

/** 서비스 이름의 키워드로 뱃지 아이콘을 고른다. 매칭되지 않으면 기본 태그 아이콘. */
const serviceFilterIconRules: { icon: LucideIcon; keywords: string[] }[] = [
  { icon: CardSim, keywords: ["유심", "usim", "esim", "심카드"] },
  { icon: Smartphone, keywords: ["휴대폰", "단말", "폰", "기기", "모바일"] },
  { icon: Wifi, keywords: ["인터넷", "와이파이", "wifi", "공유기"] },
  { icon: Tv, keywords: ["tv", "iptv", "티비"] },
  { icon: Wallet, keywords: ["수납", "납부", "결제", "청구"] },
  { icon: ReceiptText, keywords: ["요금"] },
  { icon: UserPlus, keywords: ["개통", "가입", "신규", "명의"] },
  { icon: Wrench, keywords: ["수리", "as", "a/s", "파손", "고장", "분실"] },
  { icon: RefreshCcw, keywords: ["반납", "교체", "보상", "중고"] },
  { icon: Plane, keywords: ["로밍", "해외"] },
  { icon: Link2, keywords: ["결합"] },
  { icon: BadgePercent, keywords: ["멤버십", "할인", "혜택"] },
  { icon: Phone, keywords: ["전화", "번호"] },
  { icon: Headset, keywords: ["상담"] },
];

export const getServiceFilterIcon = (label: string): LucideIcon => {
  const normalizedLabel = label.replace(/\s/g, "").toLowerCase();

  return (
    serviceFilterIconRules.find(({ keywords }) =>
      keywords.some((keyword) => normalizedLabel.includes(keyword)),
    )?.icon ?? Tag
  );
};

export type ServiceFilterCarouselProps = {
  "aria-label": string;
  consultOptions: readonly ServiceFilterOption[];
  consultValue: string[];
  onConsultChange: (value: string[]) => void;
  onProvidedChange: (value: string[]) => void;
  providedOptions: readonly ServiceFilterOption[];
  providedValue: string[];
};

/** 상담/제공 서비스 옵션을 뱃지 항목 하나의 목록으로 합친다(데스크톱·모바일 공용). */
export const buildServiceFilterItems = ({
  consultOptions,
  consultValue,
  onConsultChange,
  onProvidedChange,
  providedOptions,
  providedValue,
}: Omit<ServiceFilterCarouselProps, "aria-label">) => [
  ...consultOptions.map((option, index) => ({
    icon: getServiceFilterIcon(option.label),
    key: `consult-${option.value}`,
    label: option.label,
    onChange: onConsultChange,
    optionValue: option.value,
    pointColor: getServiceFilterColor(index),
    value: consultValue,
  })),
  ...providedOptions.map((option, index) => ({
    icon: getServiceFilterIcon(option.label),
    key: `provided-${option.value}`,
    label: option.label,
    onChange: onProvidedChange,
    optionValue: option.value,
    pointColor: getServiceFilterColor(consultOptions.length + index),
    value: providedValue,
  })),
];

export type ServiceFilterItem = ReturnType<
  typeof buildServiceFilterItems
>[number];

export const toggleServiceFilterItem = (item: ServiceFilterItem) => {
  item.onChange(
    item.value.includes(item.optionValue)
      ? item.value.filter((value) => value !== item.optionValue)
      : [...item.value, item.optionValue],
  );
};
