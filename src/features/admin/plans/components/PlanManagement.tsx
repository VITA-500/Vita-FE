"use client";
import { Ban, Edit2, Plus, RotateCcw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  PlanTargetBadge,
  planTargetGroupLabels,
  type AdminPlan,
  planTargetGroups,
} from "@/entities/plan";
import { useAdminPlans } from "@/features/admin/plans/hooks/useAdminPlans";
import { PlanFormModal } from "./PlanFormModal";
import { AdminEmptyState } from "@/features/admin/common/components/AdminEmptyState";
import { AdminErrorBanner } from "@/features/admin/common/components/AdminErrorBanner";
import { AdminPagination } from "@/features/admin/common/components/AdminPagination";
import { AdminResultSummary } from "@/features/admin/common/components/AdminResultSummary";
import { AdminTableShell } from "@/features/admin/common/components/AdminTableShell";
import { FilterDropdown } from "@/features/admin/common/components/FilterDropdown";
import { useActionStatus } from "@/features/admin/common/context/ActionStatusContext";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/atoms/Button";
import { Card } from "@/shared/ui/atoms/Card";
import { SearchInput } from "@/shared/ui/molecules/SearchInput";
import { AdminStatusBadge } from "@/features/admin/common/components/AdminStatusBadge";
import { AdminPageHeader } from "@/features/admin/common/components/AdminPageHeader";
import { AdminListToolbar } from "@/features/admin/common/components/AdminListToolbar";

const targetOptions = [
  { label: "전체 대상", value: "" },
  ...planTargetGroups.map((value) => ({
    label: planTargetGroupLabels[value],
    value,
  })),
];

const ActionTooltip = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <span className="group relative inline-flex">
    {children}
    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
      {label}
    </span>
  </span>
);

const sortOptions = [
  { label: "등록일 최신순", value: "createdAt,desc" },
  { label: "수정일 최신순", value: "updatedAt,desc" },
  { label: "월 요금 낮은순", value: "price,asc" },
];
const pageOptions = [
  { label: "20개씩", value: "20" },
  { label: "50개씩", value: "50" },
  { label: "100개씩", value: "100" },
];
const PlanCard = ({
  plan,
  onEdit,
  onToggle,
  isPending,
}: {
  plan: AdminPlan;
  onEdit: () => void;
  onToggle: () => void;
  isPending: boolean;
}) => (
  <Card padding="sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-extrabold">{plan.name}</p>
        <p className="text-text-secondary text-xs">{plan.planCode}</p>
      </div>
      <AdminStatusBadge
        label={plan.status === "ACTIVE" ? "사용 중" : "비활성"}
        tone={plan.status === "ACTIVE" ? "active" : "inactive"}
        icon={plan.status === "ACTIVE" ? "active" : "inactive"}
      />
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-gray-500">
      <span>{plan.price.toLocaleString()}원</span>
      <span>
        {plan.networkType} · <PlanTargetBadge targetGroup={plan.targetGroup} />
      </span>
    </div>
    <div className="mt-4 flex justify-end gap-2">
      <ActionTooltip label="수정">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-lg p-0 text-gray-400 hover:text-gray-700 dark:hover:text-white"
          aria-label="요금제 수정"
          onClick={onEdit}
        >
          <Edit2 size={17} />
        </Button>
      </ActionTooltip>
      <ActionTooltip label={plan.status === "ACTIVE" ? "비활성화" : "활성화"}>
        <Button
          variant="ghost"
          size="sm"
          className={
            plan.status === "ACTIVE"
              ? "h-9 w-9 rounded-lg p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
              : "h-9 w-9 rounded-lg p-0 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
          }
          aria-label={
            plan.status === "ACTIVE" ? "요금제 비활성화" : "요금제 활성화"
          }
          disabled={isPending}
          onClick={onToggle}
        >
          {plan.status === "ACTIVE" ? (
            <Ban size={17} />
          ) : (
            <RotateCcw size={17} />
          )}
        </Button>
      </ActionTooltip>
    </div>
  </Card>
);
export const PlanManagement = () => {
  const {
    plans,
    keyword,
    page,
    pageSize,
    sortBy,
    totalCount,
    totalPages,
    isLoading,
    error,
    setKeyword,
    setPage,
    setPageSize,
    setSort,
    targetGroup,
    setTargetGroup,
    createPlan,
    updatePlan,
  } = useAdminPlans();
  const { runWithStatus } = useActionStatus();
  const [draft, setDraft] = useState(keyword);
  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<number | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (draft !== keyword) setKeyword(draft);
    }, 350);
    return () => window.clearTimeout(id);
  }, [draft, keyword, setKeyword]);
  const toggle = async (plan: AdminPlan) => {
    if (pendingPlanId === plan.planId) return;
    setPendingPlanId(plan.planId);
    try {
      await runWithStatus(
        plan.status === "ACTIVE" ? "요금제 비활성화" : "요금제 활성화",
        () =>
          updatePlan(plan.planId, {
            status: plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
          }),
      );
    } finally {
      setPendingPlanId(null);
    }
  };
  const save = async (
    input:
      | Parameters<typeof createPlan>[0]
      | Partial<Parameters<typeof createPlan>[0]>,
  ) => {
    await runWithStatus(editing ? "요금제 수정" : "요금제 등록", () =>
      editing
        ? updatePlan(editing.planId, input)
        : createPlan(input as Parameters<typeof createPlan>[0]),
    );
    setEditing(null);
    setCreating(false);
  };
  const rangeStart = totalCount ? page * pageSize + 1 : 0;
  const rangeEnd = totalCount
    ? Math.min(totalCount, rangeStart + plans.length - 1)
    : 0;
  return (
    <div>
      <AdminPageHeader
        title="요금제 관리"
        description="요금제 설명을 수정하거나 항목을 비활성화할 수 있습니다."
        action={
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setCreating(true)}
          >
            요금제 등록
          </Button>
        }
      />
      <AdminListToolbar className="xl:grid-cols-[minmax(280px,420px)_auto] xl:items-start xl:justify-between">
        <div className="flex gap-2">
          <SearchInput
            placeholder="요금제 이름을 검색하세요"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          {keyword && (
            <Button
              size="sm"
              variant="secondary"
              className="h-10 shrink-0 rounded-xl"
              onClick={() => {
                setDraft("");
                setKeyword("");
              }}
            >
              초기화
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <FilterDropdown
            aria-label="요금제 대상 그룹"
            className="w-full sm:w-[140px]"
            options={targetOptions}
            value={targetGroup}
            onChange={(value) => setTargetGroup(value as typeof targetGroup)}
          />
          <FilterDropdown
            aria-label="요금제 정렬"
            className="w-full sm:w-[160px]"
            options={sortOptions}
            value={sortBy}
            onChange={setSort}
          />
          <FilterDropdown
            aria-label="페이지당 요금제 수"
            className="w-full sm:w-[120px]"
            options={pageOptions}
            value={String(pageSize)}
            onChange={(v) => setPageSize(Number(v))}
          />
        </div>
      </AdminListToolbar>
      {error && (
        <AdminErrorBanner
          message={
            error instanceof ApiError
              ? error.message
              : "요금제를 불러오지 못했어요."
          }
        />
      )}
      <div className="space-y-3 lg:hidden">
        {isLoading ? (
          <Card>
            <p className="text-text-secondary py-6 text-center text-sm font-semibold">
              요금제를 불러오고 있어요.
            </p>
          </Card>
        ) : plans.length === 0 ? (
          <Card>
            <AdminEmptyState
              title="요금제가 없습니다."
              description="검색 조건을 바꾸거나 새 요금제를 등록해 보세요."
            />
          </Card>
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.planId}
              plan={plan}
              onEdit={() => setEditing(plan)}
              isPending={pendingPlanId === plan.planId}
              onToggle={() => void toggle(plan)}
            />
          ))
        )}
        {plans.length > 0 && (
          <AdminPagination
            currentPage={page + 1}
            totalPages={totalPages}
            disabled={isLoading}
            onPageChange={(v) => setPage(v - 1)}
          />
        )}
      </div>
      <AdminTableShell
        className="hidden lg:block"
        pagination={
          plans.length > 0 && (
            <AdminPagination
              currentPage={page + 1}
              totalPages={totalPages}
              disabled={isLoading}
              onPageChange={(v) => setPage(v - 1)}
            />
          )
        }
      >
        <table className="w-full table-fixed border-collapse text-sm">
          <thead className="bg-surface-muted text-xs font-extrabold text-gray-400 dark:bg-white/5">
            <tr>
              <th className="w-[25%] px-5 py-4 text-left">요금제</th>
              <th className="px-4 py-4 text-left">월 요금</th>
              <th className="px-4 py-4 text-left">네트워크</th>
              <th className="px-4 py-4 text-left">대상</th>
              <th className="px-4 py-4 text-center">상태</th>
              <th className="w-[180px] px-5 py-4 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-border-soft divide-y dark:divide-white/10">
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-text-secondary h-[480px] text-center"
                >
                  요금제를 불러오고 있어요.
                </td>
              </tr>
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-[480px]">
                  <AdminEmptyState
                    title="요금제가 없습니다."
                    description="검색 조건을 바꾸거나 새 요금제를 등록해 보세요."
                  />
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr
                  key={plan.planId}
                  className="transition hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <td className="px-5 py-4">
                    <p className="truncate font-extrabold">{plan.name}</p>
                    <p className="text-text-secondary mt-1 text-xs">
                      {plan.planCode}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-bold">
                    {plan.price.toLocaleString()}원
                  </td>
                  <td className="px-4 py-4">{plan.networkType}</td>
                  <td className="px-4 py-4">
                    <PlanTargetBadge targetGroup={plan.targetGroup} />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <AdminStatusBadge
                      label={plan.status === "ACTIVE" ? "사용 중" : "비활성"}
                      tone={plan.status === "ACTIVE" ? "active" : "inactive"}
                      icon={plan.status === "ACTIVE" ? "active" : "inactive"}
                    />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex gap-2">
                      <ActionTooltip label="수정">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 rounded-lg p-0 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                          aria-label="요금제 수정"
                          disabled={pendingPlanId === plan.planId}
                          onClick={() => setEditing(plan)}
                        >
                          <Edit2 size={18} />
                        </Button>
                      </ActionTooltip>
                      <ActionTooltip
                        label={plan.status === "ACTIVE" ? "비활성화" : "활성화"}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className={
                            plan.status === "ACTIVE"
                              ? "h-10 w-10 rounded-lg p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                              : "h-10 w-10 rounded-lg p-0 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                          }
                          aria-label={
                            plan.status === "ACTIVE"
                              ? "요금제 비활성화"
                              : "요금제 활성화"
                          }
                          disabled={pendingPlanId === plan.planId}
                          onClick={() => void toggle(plan)}
                        >
                          {plan.status === "ACTIVE" ? (
                            <Ban size={18} />
                          ) : (
                            <RotateCcw size={18} />
                          )}
                        </Button>
                      </ActionTooltip>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableShell>
      <AdminResultSummary
        keyword={keyword}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalCount={totalCount}
      />
      <PlanFormModal
        key={`${creating ? "create" : "edit"}-${editing?.planId ?? "new"}`}
        isOpen={creating || Boolean(editing)}
        mode={editing ? "edit" : "create"}
        initialValues={editing ?? undefined}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={save}
      />
    </div>
  );
};
