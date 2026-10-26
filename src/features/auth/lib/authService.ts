import { userApi } from "@/entities/user";
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from "@/features/auth/types";
import { requestJson } from "@/shared/api/http";
import { env } from "@/shared/config/env";

export type OAuthProvider = "google" | "kakao" | "naver";

const createOAuthAuthorizationUrl = (provider: OAuthProvider) => {
  if (!env.apiBaseUrl)
    throw new Error("로그인 서버 주소가 설정되지 않았습니다.");
  return `${env.apiBaseUrl.replace(/\/$/, "")}/oauth2/authorization/${provider}`;
};

export const authService = {
  createOAuthAuthorizationUrl,
  /** 내 정보 조회·수정은 entities/user로 옮겼고 기존 호출부 호환을 위해 남겨 둔다. */
  getMe: userApi.getMe,
  login: (request: LoginRequest) => {
    if (!env.apiBaseUrl)
      throw new Error("로그인 서버 주소가 설정되지 않았습니다.");
    return requestJson<LoginResponse>("/auth/login", {
      body: JSON.stringify(request),
      method: "POST",
    });
  },
  /** 로그아웃은 로그인 상태와 함께 entities/user로 옮겼고 기존 호출부 호환을 위해 남겨 둔다. */
  logout: userApi.logout,
  signup: (request: SignupRequest) => {
    if (!env.apiBaseUrl)
      throw new Error("로그인 서버 주소가 설정되지 않았습니다.");
    return requestJson<SignupResponse>("/auth/signup", {
      body: JSON.stringify(request),
      method: "POST",
    });
  },
  updateMe: userApi.updateMe,
};
