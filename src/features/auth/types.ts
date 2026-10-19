// 사용자 타입은 entities/user로 옮겼다. 기존 import 경로 호환용 재내보내기.
import type { AuthUser } from "@/entities/user";
export type {
  AuthUser,
  MyPageResponse,
  MyPageUpdateRequest,
  MyPageUpdateResponse,
} from "@/entities/user";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
};

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
};

export type SignupResponse = {
  userId: number;
  email: string;
  name: string;
  createdAt: string;
};
