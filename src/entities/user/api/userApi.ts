import type {
  MyPageResponse,
  MyPageUpdateRequest,
  MyPageUpdateResponse,
} from "@/entities/user/model/types";
import { requestJson } from "@/shared/api/http";

/** 내 정보 API (/users/me)와 로그인 세션 끊기(/auth/logout) */
export const userApi = {
  getMe: () => requestJson<MyPageResponse>("/users/me"),
  /** 로그아웃. 로그인 상태(AuthProvider)가 쓴다. 로그인·회원가입 요청은 features/auth에 있다. */
  logout: () => requestJson<void>("/auth/logout", { method: "POST" }),
  updateMe: (request: MyPageUpdateRequest) =>
    requestJson<MyPageUpdateResponse>("/users/me", {
      body: JSON.stringify(request),
      method: "PATCH",
    }),
};
