import type {
  LoginRequest,
  LoginResponse,
  MyPageResponse,
  SignupRequest,
  SignupResponse,
} from "@/features/auth/types";
import { tokenStorage } from "@/features/auth/lib/tokenStorage";
import { requestJson } from "@/shared/api/http";

export const authService = {
  getMe: () => {
    const accessToken = tokenStorage.getAccessToken();

    return requestJson<MyPageResponse>("/users/me", {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    });
  },
  login: (request: LoginRequest) => {
    return requestJson<LoginResponse>("/auth/login", {
      body: JSON.stringify(request),
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
