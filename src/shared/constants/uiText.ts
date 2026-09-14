// 화면 문구
import { routes } from "@/shared/constants/routes";

export const uiText = {
  common: {
    title: "Vita",
  },

  home: {
    heroBadge: "AI 통신 상담",
    heroTitleLead: "통신이 복잡할 땐,",
    heroTitleHighlight: "VITA에게 물어보세요.",
    heroDescription:
      "궁금한 내용을 자연어로 물어보면 필요한 정보를 찾아 정리하고\n가까운 매장까지 한 번에 안내해요.",
    heroButton: "지금 시작하기",

    preview: {
      activeMenu: "AI 상담",
      status: "FAQ 기반 답변",
      title: "무엇을 도와드릴까요?",
      description: "통신 서비스에 대해 궁금한 내용을 편하게 물어보세요.",
      input: "예: 휴대폰을 잃어버렸어요",
      suggestionTitle: "휴대폰을 잃어버렸어요",
      suggestionText: "분실 신고와 유심 보호 절차를 안내해드려요.",
    },

    trial: {
      remainingLabel: "무료 상담 {count}회 남음",
      limitTitle: "이어서 상담하려면 로그인이 필요해요.",
      limitDescription:
        "홈에서는 5회까지 미리 상담해볼 수 있어요. 로그인하면 상담 기록을 이어서 챗봇 화면에서 계속 확인할 수 있습니다.",
      limitInput: "로그인 후 계속 상담할 수 있어요",
      loginPromptTitle: "무료 상담 5회를 모두 사용했어요.",
      loginPromptDescription:
        "로그인하고 방금 나눈 상담 내용을 이어서 확인해보세요.",
      loginButton: "로그인하고 계속 상담하기",
    },

    introLabel: "01  AI 상담",
    introTitle: "검색하지 않아도,\n그냥 물어보면 돼요.",
    introDescription:
      "질문과 가장 관련 있는 FAQ를 찾아\n필요한 내용만 이해하기 쉽게 정리해드려요.",
    mapLabel: "02  매장 지도",
    mapTitle: "가까운 매장도\n바로 찾아보세요.",
    mapDescription:
      "현재 위치를 기준으로 가까운 매장을 찾고\n지도에서 위치와 거리를 한눈에 확인할 수 있어요.",

    recommendLabel: "03  추천",
    recommendTitle: "나에게 맞는 요금제를\n한눈에 비교해보세요.",
    recommendDescription:
      "사용 패턴과 상담 내용을 바탕으로\n추천 요금제와 주요 혜택을 쉽게 비교할 수 있어요.",

    featureLabel: "주요 기능",
    featureTitle: "통신 정보,\n여기저기 찾지 마세요.",
    featureDescription: "상담부터 탐색까지 VITA 안에서 이어집니다.",

    features: [
      {
        title: "FAQ 둘러보기",
        description:
          "카테고리별 질문을 직접 찾아보고 자주 묻는 내용을 빠르게 확인해요.",
      },
      {
        title: "요금제 비교",
        description:
          "가상의 요금제를 나란히 두고 조건과 차이를 한눈에 비교해요.",
      },
      {
        title: "최근 본 매장",
        description:
          "상담이나 지도에서 확인한 매장을 다시 빠르게 찾아볼 수 있어요.",
      },
    ],

    stepsTitle: "VITA는 이렇게 답해요.",
    stepsDescription: "질문부터 답변까지, 필요한 과정만 간단하게.",
    steps: [
      { title: "질문하기", description: "궁금한 내용을 자연어로 입력" },
      { title: "정보 찾기", description: "관련 FAQ와 정보를 검색" },
      { title: "답변 받기", description: "필요한 내용만 정리해서 안내" },
      { title: "매장 확인", description: "필요하면 가까운 매장까지 연결" },
    ],

    ctaTitle: "통신이 궁금해지는 순간,\nVITA에게 바로 물어보세요.",
    ctaButton: "VITA 시작하기",
  },

  footer: {
    description:
      "Vita는 사용자의 질문과 상황에 맞춰 빠르고 정확한 답변을 제공하고, 상담 내역과 맞춤형 추천까지 한곳에서 확인할 수 있는 상담 지원 플랫폼입니다.",

    columns: [
      {
        title: "서비스",
        links: [
          { label: "서비스 소개", href: routes.home },
          { label: "AI 상담 시작하기", href: routes.chat },
          { label: "주요 기능", href: `${routes.home}#features` },
          { label: "이용 흐름", href: `${routes.home}#service-flow` },
        ],
      },
      {
        title: "상담",
        links: [
          { label: "새로운 상담", href: routes.chat },
          { label: "분실 상담 시작", href: routes.chat },
          { label: "맞춤 상담", href: routes.chat },
          { label: "매장 찾기 상담", href: routes.chat },
        ],
      },
      {
        title: "고객지원",
        links: [
          { label: "로그인", href: routes.login },
          { label: "무료 체험 상담", href: routes.home },
          { label: "AI 상담 화면", href: routes.chat },
          { label: "서비스 흐름", href: `${routes.home}#service-flow` },
        ],
      },
      {
        title: "프로젝트",
        links: [
          { label: "홈", href: routes.home },
          { label: "기능 소개", href: `${routes.home}#features` },
          {
            label: "GitHub Repository",
            href: "https://github.com/orgs/VITA-500/repositories",
          },
          { label: "문의하기", href: "mailto:example@example.com" },
        ],
      },
    ],

    copyright: "© 2026 Vita. All rights reserved.",
  },

  theme: {
    lightMode: "라이트 모드",
    darkMode: "다크 모드",
  },
};

export type UiText = typeof uiText;
