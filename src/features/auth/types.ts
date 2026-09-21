export type AuthUser = {
  userId: number;
  email: string | null;
  name: string;
  role: string;
};

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

export type MyPageResponse = AuthUser & {
  phone?: string;
  hasPassword: boolean;
  linkedProviders: string[];
};
