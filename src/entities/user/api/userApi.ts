import type {
  MyPageResponse,
  MyPageUpdateRequest,
  MyPageUpdateResponse,
} from "@/entities/user/model/types";
import { requestJson } from "@/shared/api/http";

/** 내 정보 API (/users/me) */
export const userApi = {
  getMe: () => requestJson<MyPageResponse>("/users/me"),
  updateMe: (request: MyPageUpdateRequest) =>
    requestJson<MyPageUpdateResponse>("/users/me", {
      body: JSON.stringify(request),
      method: "PATCH",
    }),
};
