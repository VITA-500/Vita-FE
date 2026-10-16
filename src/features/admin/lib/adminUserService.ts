import type {
  AdminUserDetail,
  AdminUserListResponse,
  AdminUserRole,
  AdminUserStatus,
} from "@/features/admin/types/adminUsers";
import { requestJson } from "@/shared/api/http";

export const adminUserService = {
  fetchUsers: (params: {
    page: number;
    size: number;
    keyword?: string;
    role?: AdminUserRole;
    status?: AdminUserStatus;
  }) => {
    const query = new URLSearchParams({
      page: String(params.page),
      size: String(params.size),
    });
    if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());
    if (params.role) query.set("role", params.role);
    if (params.status) query.set("status", params.status);
    return requestJson<AdminUserListResponse>(
      `/admin/users?${query.toString()}`,
    );
  },
  getUser: (userId: number) =>
    requestJson<AdminUserDetail>(`/admin/users/${userId}`),
  updateRole: (userId: number, role: AdminUserRole, reason: string) =>
    requestJson<AdminUserDetail>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role, reason }),
    }),
  updateStatus: (userId: number, status: AdminUserStatus, reason: string) =>
    requestJson<AdminUserDetail>(`/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    }),
};
