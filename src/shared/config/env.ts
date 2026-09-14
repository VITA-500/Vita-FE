export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
  kakaoMapAppKey: process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "",
} as const;

export const hasKakaoMapKey = Boolean(env.kakaoMapAppKey);
