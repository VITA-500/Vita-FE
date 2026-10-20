import type { PageResponse } from "@/shared/api/response";

export type AdminUserRole = "USER" | "ADMIN";
export type AdminUserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type AdminUserListItem = {
  userId: number;
  email: string;
  name: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  phone: string | null;
  hasPassword: boolean;
  updatedAt: string;
};

export type AdminUserListResponse = PageResponse<AdminUserListItem>;
