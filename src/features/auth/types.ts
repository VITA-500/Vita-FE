import type { AuthUser } from "@/entities/user";

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
