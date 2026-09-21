import type {
  LoginRequest,
  LoginResponse,
  MyPageResponse,
  SignupRequest,
  SignupResponse,
} from "@/features/auth/types";
import { requestJson } from "@/shared/api/http";

export const authService = {
  getMe: () => {
    return requestJson<MyPageResponse>("/users/me");
  },
  login: (request: LoginRequest) => {
    return requestJson<LoginResponse>("/auth/login", {
      body: JSON.stringify(request),
      method: "POST",
    });
  },
  logout: () => {
    return requestJson<void>("/auth/logout", {
      method: "POST",
    });
  },
  signup: (request: SignupRequest) => {
    return requestJson<SignupResponse>("/auth/signup", {
      body: JSON.stringify(request),
      method: "POST",
    });
  },
};
