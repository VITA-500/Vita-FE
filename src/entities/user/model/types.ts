/** 로그인한 사용자 기본 정보 (BE 로그인·내 정보 응답 공통) */
export type AuthUser = {
  userId: number;
  email: string | null;
  name: string;
  role: string;
};

export type MyPageResponse = AuthUser & {
  phone?: string;
  hasPassword: boolean;
  linkedProviders: string[];
};

export type MyPageUpdateRequest = {
  name?: string;
  password?: string;
};

export type MyPageUpdateResponse = {
  userId: number;
  name: string;
  updatedAt: string;
};
