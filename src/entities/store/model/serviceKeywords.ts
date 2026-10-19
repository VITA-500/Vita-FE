/**
 * 사용자가 쓰는 표현 → 매장 서비스(상담 가능/제공 서비스) 이름 매핑.
 * 매장명보다 "무엇을 하러 가는지"로 찾는 경우가 많아, 검색어·채팅 답변에서 서비스를 알아내는 데 쓴다.
 * service 값은 매장 데이터(consultServices/providedServices)의 이름과 같아야 한다.
 */
const SERVICE_KEYWORD_RULES: { keywords: string[]; service: string }[] = [
  {
    service: "요금수납",
    keywords: ["요금수납", "수납", "납부", "요금내", "미납", "연체"],
  },
  {
    service: "요금제변경",
    keywords: ["요금제변경", "요금제", "요금변경", "플랜변경"],
  },
  {
    service: "분실·정지 신고",
    keywords: ["분실", "정지", "도난", "잃어버", "일시정지", "분실신고"],
  },
  { service: "로밍상담", keywords: ["로밍", "해외", "출국", "여행"] },
  {
    service: "인터넷상담",
    keywords: ["인터넷", "와이파이", "wifi", "iptv", "tv", "공유기"],
  },
  {
    service: "휴대폰상담",
    keywords: [
      "휴대폰",
      "핸드폰",
      "스마트폰",
      "기기변경",
      "개통",
      "단말",
      "유심",
      "usim",
      "esim",
    ],
  },
  { service: "방문예약 가능", keywords: ["방문예약", "예약"] },
  { service: "주차 가능", keywords: ["주차"] },
];

/** 매장 데이터의 상담 가능 업무(consultServices) 이름. 채팅 지도에서 매장 지도와 같은 색을 정하는 데 쓴다. */
export const KNOWN_CONSULT_SERVICES = SERVICE_KEYWORD_RULES.map(
  ({ service }) => service,
).filter((service) => !service.endsWith("가능"));

/** 매장 데이터의 제공 서비스(providedServices) 이름 */
export const KNOWN_PROVIDED_SERVICES = SERVICE_KEYWORD_RULES.map(
  ({ service }) => service,
).filter((service) => service.endsWith("가능"));

const normalize = (text: string) =>
  text.replace(/[\s·.,/_-]/g, "").toLowerCase();

/**
 * 텍스트에 들어 있는 서비스 이름을 찾는다.
 * availableServices를 주면 그 안에 있는 서비스만 돌려준다(매장 데이터에 없는 서비스는 제외).
 */
export const findServicesInText = (
  text: string,
  availableServices?: readonly string[],
) => {
  const normalizedText = normalize(text);

  if (!normalizedText) {
    return [];
  }

  const available = availableServices ? new Set(availableServices) : null;
  const matched = new Set<string>();

  // 매장 데이터에 실제로 있는 서비스 이름이 그대로 들어 있으면 우선 매칭
  availableServices?.forEach((service) => {
    if (normalizedText.includes(normalize(service))) {
      matched.add(service);
    }
  });

  SERVICE_KEYWORD_RULES.forEach(({ keywords, service }) => {
    if (available && !available.has(service)) {
      return;
    }

    if (
      keywords.some((keyword) => normalizedText.includes(normalize(keyword)))
    ) {
      matched.add(service);
    }
  });

  return Array.from(matched);
};
