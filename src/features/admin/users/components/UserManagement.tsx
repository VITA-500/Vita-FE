"use client";

import { useState } from "react";
import {
  Ban,
  CheckCircle2,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useAdminUsers } from "@/features/admin/users/hooks/useAdminUsers";
import { useAdminUserSummary } from "@/features/admin/users/hooks/useAdminUserSummary";
import type { AdminUserListItem, AdminUserStatus } from "@/entities/user";
import { Card } from "@/shared/ui/atoms/Card";
import { Select } from "@/shared/ui/atoms/Select";
import { SearchInput } from "@/shared/ui/molecules/SearchInput";
import { Button } from "@/shared/ui/atoms/Button";
import { AdminStatusBadge } from "@/features/admin/common/components/AdminStatusBadge";

const UserManagement = () => {
  const [selected, setSelected] = useState<AdminUserListItem | null>(null);
  const {
    users,
    totalCount,
    keyword,
    status,
    isLoading: loading,
    setKeyword,
    setStatus,
    refetch,
    changeUserStatus,
  } = useAdminUsers();
  const { summary } = useAdminUserSummary();

  const changeStatus = async (user: AdminUserListItem) => {
    const nextStatus: AdminUserStatus =
      user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const reason = window.prompt("변경 사유를 입력해 주세요.");
    if (!reason?.trim()) return;
    await changeUserStatus(user.userId, nextStatus, reason);
  };

  const statusLabel: Record<AdminUserStatus, string> = {
    ACTIVE: "활성",
    SUSPENDED: "정지",
    DELETED: "탈퇴",
  };
  const statItems: Array<{
    label: string;
    count: number;
    Icon: LucideIcon;
    color: string;
  }> = [
    {
      label: "전체 회원",
      count: totalCount,
      Icon: UsersRound,
      color: "text-brand bg-brand/10",
    },
    {
      label: "활성 회원",
      count: summary?.active ?? 0,
      Icon: UserRound,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "정지 회원",
      count: summary?.suspended ?? 0,
      Icon: UserRound,
      color: "text-rose-600 bg-rose-50",
    },
    {
      label: "관리자",
      count: summary?.admins ?? 0,
      Icon: ShieldCheck,
      color: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 p-5 md:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-brand text-sm font-extrabold">VITA ADMIN</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">회원 관리</h1>
          <p className="mt-2 text-sm text-gray-500">
            회원 상태와 관리자 권한을 한 곳에서 관리합니다.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-500 shadow-sm dark:bg-zinc-900">
          총 {totalCount}명
        </span>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map(({ label, count, Icon, color }) => (
          <Card key={label} className="flex items-center gap-3 p-4">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
            >
              <Icon size={19} />
            </span>
            <div>
              <p className="text-xs font-bold text-gray-500">{label}</p>
              <p className="mt-0.5 text-xl font-black">{count}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            className="md:max-w-md"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="이메일 또는 이름으로 검색"
          />
          <Select
            className="h-11 w-auto min-w-32 rounded-xl"
            aria-label="회원 상태 필터"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AdminUserStatus | "")
            }
            options={[
              { value: "", label: "전체 상태" },
              { value: "ACTIVE", label: "활성" },
              { value: "SUSPENDED", label: "정지" },
              { value: "DELETED", label: "탈퇴" },
            ]}
          />
          <Button
            size="sm"
            className="h-11 px-5"
            onClick={() => void refetch()}
          >
            검색
          </Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-surface-muted text-xs font-bold text-gray-500">
              <tr>
                <th className="px-5 py-3.5">회원</th>
                <th className="px-5 py-3.5">역할</th>
                <th className="px-5 py-3.5">상태</th>
                <th className="px-5 py-3.5">가입일</th>
                <th className="px-5 py-3.5 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center" colSpan={5}>
                    불러오는 중...
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.userId}
                    className="border-border border-t transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4">
                      <button
                        className="hover:text-brand font-extrabold"
                        onClick={() => setSelected(user)}
                      >
                        {user.name}
                      </button>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <AdminStatusBadge
                        label={user.role === "ADMIN" ? "관리자" : "회원"}
                        tone={user.role === "ADMIN" ? "admin" : "neutral"}
                        icon={user.role === "ADMIN" ? "admin" : undefined}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <AdminStatusBadge
                        label={statusLabel[user.status]}
                        tone={
                          user.status === "ACTIVE"
                            ? "active"
                            : user.status === "SUSPENDED"
                              ? "warning"
                              : "inactive"
                        }
                        icon={
                          user.status === "ACTIVE"
                            ? "active"
                            : user.status === "SUSPENDED"
                              ? "warning"
                              : "inactive"
                        }
                      />
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {user.status !== "DELETED" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void changeStatus(user)}
                          leftIcon={
                            user.status === "SUSPENDED" ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <Ban size={14} />
                            )
                          }
                        >
                          {user.status === "SUSPENDED" ? "정지 해제" : "정지"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {selected && (
          <div className="border-border bg-surface-muted border-t px-5 py-4 text-sm">
            <b>{selected.name}</b> 회원을 선택했습니다. 상세 수정 기능은 다음
            단계에서 연결할 수 있습니다.
          </div>
        )}
      </Card>
    </section>
  );
};

export default UserManagement;
