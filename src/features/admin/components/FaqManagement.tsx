"use client";

import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { AdminEmptyState } from "@/features/admin/components/AdminEmptyState";
import { AdminField } from "@/features/admin/components/AdminField";
import { FilterDropdown } from "@/features/admin/components/FilterDropdown";
import { useActionStatus } from "@/features/admin/context/ActionStatusContext";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import {
  adminFaqCategories,
  adminFaqSubcategories,
  type AdminFaq,
  type AdminFaqCategory,
} from "@/features/admin/types";
import { cn } from "@/shared/lib/cn";
import { AnimatedLockIcon } from "@/shared/ui/AnimatedLockIcon";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { ConfirmCheckbox } from "@/shared/ui/ConfirmCheckbox";
import { Modal } from "@/shared/ui/Modal";
import { SearchInput } from "@/shared/ui/SearchInput";
import { showToast } from "@/shared/ui/ToastProvider";
import type { SelectOption } from "@/shared/ui/Select";

const faqCategoryOptions: readonly SelectOption[] = adminFaqCategories.map(
  (category) => ({ label: category, value: category }),
);
const getFaqSubcategoryOptions = (
  category?: string,
): readonly SelectOption[] =>
  category && category in adminFaqSubcategories
    ? adminFaqSubcategories[category as AdminFaqCategory].map(
        (subcategory) => ({
          label: subcategory,
          value: subcategory,
        }),
      )
    : [];

type FaqCategoryFilter = "ALL" | AdminFaqCategory;
type FaqStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const faqCategoryFilterOptions: readonly SelectOption[] = [
  { label: "전체", value: "ALL" },
  ...faqCategoryOptions,
];

const faqStatusFilterOptions = [
  { label: "전체", value: "ALL" },
  { label: "활성", value: "ACTIVE" },
  { label: "비활성", value: "INACTIVE" },
] as const;
const faqSortOptions = [
  { label: "최신 등록순", value: "createdAt:desc" },
  { label: "최근 수정순", value: "updatedAt:desc" },
] as const;
const pageSizeOptions = [20, 50, 100] as const;
const pageSizeFilterOptions = pageSizeOptions.map((pageSize) => ({
  label: `${pageSize}개`,
  value: String(pageSize),
}));
const MIN_TABLE_ROWS = 8;

export const FaqManagement = () => {
  const {
    addFaq,
    deleteFaq,
    faqCategoryFilter,
    faqError,
    faqKeyword,
    faqPage,
    faqPageSize,
    faqSortDirection,
    faqSortField,
    faqStatusFilter,
    faqTotalCount,
    faqTotalPages,
    faqs,
    isFaqLoading,
    saveFaq,
    setFaqCategoryFilter,
    setFaqKeyword,
    setFaqPage,
    setFaqPageSize,
    setFaqSort,
    setFaqStatus,
    setFaqStatusFilter,
  } = useAdminData();
  const { runWithStatus } = useActionStatus();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [deactivatingFaqId, setDeactivatingFaqId] = useState<number | null>(
    null,
  );
  const [activatingFaqId, setActivatingFaqId] = useState<number | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);
  const [isFaqDeleteAcknowledged, setIsFaqDeleteAcknowledged] = useState(false);
  const [searchDraft, setSearchDraft] = useState(faqKeyword);
  const hasSearchKeyword = faqKeyword.trim().length > 0;
  const shouldShowSkeletonRows = isFaqLoading;
  const visibleSkeletonRows = shouldShowSkeletonRows
    ? Math.min(faqPageSize, MIN_TABLE_ROWS)
    : 0;
  const fillerRowCount = !shouldShowSkeletonRows
    ? Math.max(0, MIN_TABLE_ROWS - faqs.length)
    : 0;

  const editingFaq = faqs.find((faq) => faq.faqId === editingFaqId);
  const deactivatingFaq = faqs.find((faq) => faq.faqId === deactivatingFaqId);
  const activatingFaq = faqs.find((faq) => faq.faqId === activatingFaqId);
  const deletingFaq = faqs.find((faq) => faq.faqId === deletingFaqId);
  const rangeStart = faqTotalCount === 0 ? 0 : faqPage * faqPageSize + 1;
  const rangeEnd =
    faqTotalCount === 0
      ? 0
      : Math.min(faqTotalCount, rangeStart + faqs.length - 1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchDraft !== faqKeyword) {
        setFaqKeyword(searchDraft);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [faqKeyword, searchDraft, setFaqKeyword]);

  const clearSearch = () => {
    setSearchDraft("");
    setFaqKeyword("");
  };

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-normal text-gray-950 dark:text-white">
            FAQ 관리
          </h1>
          <p className="text-text-secondary mt-2 text-sm font-medium">
            FAQ를 검색하고, 카테고리별로 관리할 수 있습니다.
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          FAQ 등록
        </Button>
      </div>

      <div className="mb-7 grid gap-3 xl:grid-cols-[minmax(280px,420px)_auto] xl:items-start xl:justify-between">
        <div className="flex gap-2">
          <SearchInput
            placeholder="질문이나 키워드를 검색하세요"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          {hasSearchKeyword && (
            <Button
              variant="secondary"
              size="sm"
              className="h-12 shrink-0 rounded-2xl"
              onClick={clearSearch}
            >
              초기화
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <FilterDropdown
            aria-label="FAQ 정렬"
            className="w-full sm:w-[160px]"
            options={faqSortOptions}
            value={`${faqSortField}:${faqSortDirection}`}
            onChange={(nextValue) => {
              const [field, direction] = nextValue.split(":");
              setFaqSort(
                field as "createdAt" | "updatedAt",
                direction as "asc" | "desc",
              );
            }}
          />
          <FilterDropdown
            aria-label="카테고리 필터"
            className="w-full sm:w-[160px]"
            options={faqCategoryFilterOptions}
            value={faqCategoryFilter}
            onChange={(nextValue) => {
              setFaqCategoryFilter(nextValue as FaqCategoryFilter);
            }}
          />
          <FilterDropdown
            aria-label="FAQ 상태 필터"
            className="w-full sm:w-[120px]"
            options={faqStatusFilterOptions}
            value={faqStatusFilter}
            onChange={(nextValue) =>
              setFaqStatusFilter(nextValue as FaqStatusFilter)
            }
          />
          <FilterDropdown
            aria-label="페이지당 FAQ 수"
            className="w-full sm:w-[120px]"
            options={pageSizeFilterOptions}
            value={String(faqPageSize)}
            onChange={(nextValue) => setFaqPageSize(Number(nextValue))}
          />
        </div>
      </div>

      {faqError && (
        <div className="mb-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {faqError}
        </div>
      )}

      <div className="space-y-3 md:hidden">
        {shouldShowSkeletonRows ? (
          Array.from(
            { length: Math.min(visibleSkeletonRows, 4) },
            (_, index) => (
              <FaqSkeletonCard key={`faq-card-skeleton-${index}`} />
            ),
          )
        ) : faqs.length === 0 ? (
          <Card>
            <AdminEmptyState
              title="조건에 맞는 FAQ가 없습니다."
              description="검색어와 카테고리 필터를 조정하거나 새 FAQ를 등록해 주세요."
            />
          </Card>
        ) : (
          faqs.map((faq) => (
            <Card key={faq.faqId} padding="sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-extrabold text-gray-900 dark:text-white">
                    {faq.question}
                  </p>
                  <div className="text-text-secondary mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
                    <span>#{faq.faqId}</span>
                    <span>{faq.category}</span>
                    <span>{faq.createdAt.slice(0, 10)}</span>
                    <span>수정 {formatDate(faq.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-1.5">
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-9 w-9 rounded-lg p-0 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                  aria-label="FAQ 수정"
                  onClick={() => setEditingFaqId(faq.faqId)}
                >
                  <Edit2 size={20} />
                </Button>
                {faq.status === "ACTIVE" ? (
                  <Button
                    variant="dangerGhost"
                    size="xs"
                    className="h-9 rounded-lg px-2.5"
                    aria-label="FAQ 비활성화"
                    leftIcon={<EyeOff size={15} />}
                    onClick={() => setDeactivatingFaqId(faq.faqId)}
                  >
                    비활성화
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-9 rounded-lg px-2.5 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-500/10 dark:hover:text-green-300"
                    aria-label="FAQ 활성화"
                    leftIcon={<Eye size={15} />}
                    onClick={() => setActivatingFaqId(faq.faqId)}
                  >
                    활성화
                  </Button>
                )}
                <Button
                  variant="dangerGhost"
                  size="xs"
                  className="h-9 w-9 rounded-lg p-0"
                  aria-label="FAQ 삭제"
                  onClick={() => setDeletingFaqId(faq.faqId)}
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            </Card>
          ))
        )}
        {!shouldShowSkeletonRows && faqs.length > 0 && (
          <FaqPagination
            currentPage={faqPage + 1}
            disabled={isFaqLoading}
            totalPages={faqTotalPages}
            onPageChange={(page) => setFaqPage(page - 1)}
          />
        )}
      </div>

      <Card padding="none" className="hidden overflow-hidden md:block">
        <div>
          <table className="w-full table-fixed border-collapse text-sm">
            <thead className="bg-surface-muted text-xs font-extrabold text-gray-400 dark:bg-white/5">
              <tr>
                <th className="w-[88px] px-5 py-4 text-left">ID</th>
                <th className="px-4 py-4 text-left">질문</th>
                <th className="w-[22%] px-4 py-4 text-left">카테고리</th>
                <th className="w-[128px] px-4 py-4 text-center">등록일</th>
                <th className="w-[128px] px-4 py-4 text-center">수정일</th>
                <th className="w-[270px] px-5 py-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-border-soft divide-y dark:divide-white/10">
              {shouldShowSkeletonRows ? (
                Array.from({ length: visibleSkeletonRows }, (_, index) => (
                  <FaqSkeletonRow key={`faq-skeleton-${index}`} />
                ))
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-[640px] px-5 py-0">
                    <AdminEmptyState
                      title="조건에 맞는 FAQ가 없습니다."
                      description="검색어와 카테고리 필터를 조정하거나 새 FAQ를 등록해 주세요."
                    />
                  </td>
                </tr>
              ) : (
                <>
                  {faqs.map((faq) => (
                    <tr
                      key={faq.faqId}
                      className="hover:bg-surface-muted/70 min-h-20 transition dark:hover:bg-white/5"
                    >
                      <td className="px-5 py-4 font-bold text-gray-400">
                        #{faq.faqId}
                      </td>
                      <td className="px-4 py-4 font-extrabold break-keep whitespace-normal text-gray-800 dark:text-gray-100">
                        {faq.question}
                      </td>
                      <td className="truncate px-4 py-4 font-semibold text-gray-500">
                        {faq.category}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-gray-400">
                        {formatDate(faq.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-gray-400">
                        {formatDate(faq.updatedAt)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-12 w-12 rounded-lg p-0 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            aria-label="FAQ 수정"
                            onClick={() => setEditingFaqId(faq.faqId)}
                          >
                            <Edit2 size={30} />
                          </Button>
                          {faq.status === "ACTIVE" ? (
                            <Button
                              variant="dangerGhost"
                              size="sm"
                              className="h-10 rounded-lg px-3.5"
                              aria-label="FAQ 비활성화"
                              leftIcon={<EyeOff size={16} />}
                              onClick={() => setDeactivatingFaqId(faq.faqId)}
                            >
                              비활성화
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 rounded-lg px-3.5 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-500/10 dark:hover:text-green-300"
                              aria-label="FAQ 활성화"
                              leftIcon={<Eye size={16} />}
                              onClick={() => setActivatingFaqId(faq.faqId)}
                            >
                              활성화
                            </Button>
                          )}
                          <Button
                            variant="dangerGhost"
                            size="sm"
                            className="h-12 w-12 rounded-lg p-0"
                            aria-label="FAQ 삭제"
                            onClick={() => setDeletingFaqId(faq.faqId)}
                          >
                            <Trash2 size={30} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {Array.from({
                    length: fillerRowCount,
                  }).map((_, index) => (
                    <tr
                      key={`filler-${index}`}
                      aria-hidden="true"
                      className="h-20"
                    >
                      <td colSpan={6} />
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
        {!shouldShowSkeletonRows && faqs.length > 0 && (
          <div className="border-border-soft flex items-center justify-center gap-1 border-t px-5 py-4 dark:border-white/10">
            <FaqPagination
              currentPage={faqPage + 1}
              disabled={isFaqLoading}
              totalPages={faqTotalPages}
              onPageChange={(page) => setFaqPage(page - 1)}
            />
          </div>
        )}
      </Card>

      <p className="text-text-secondary mt-4 text-sm font-bold">
        {hasSearchKeyword && `"${faqKeyword.trim()}" 검색 결과 `}
        {rangeStart.toLocaleString("ko-KR")}-{rangeEnd.toLocaleString("ko-KR")}{" "}
        / 총 {faqTotalCount.toLocaleString("ko-KR")}개
      </p>

      <FaqFormModal
        isOpen={isCreateModalOpen}
        mode="create"
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(input) => {
          void runWithStatus("FAQ 등록", () => addFaq(input));
          setIsCreateModalOpen(false);
        }}
      />

      <FaqFormModal
        isOpen={editingFaq !== undefined}
        mode="edit"
        initialValues={editingFaq}
        onClose={() => setEditingFaqId(null)}
        onSave={(input) => {
          if (!editingFaq) return;
          const faqId = editingFaq.faqId;
          void runWithStatus("FAQ 수정", () => saveFaq(faqId, input));
          setEditingFaqId(null);
        }}
      />

      <Modal
        isOpen={deactivatingFaq !== undefined}
        onClose={() => setDeactivatingFaqId(null)}
        title="FAQ를 비활성화할까요?"
        description="비활성화된 FAQ는 관리자 목록에는 남지만 사용자 검색 및 RAG 답변 대상에서는 제외됩니다."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeactivatingFaqId(null)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (deactivatingFaq) {
                  const faqId = deactivatingFaq.faqId;
                  void runWithStatus("FAQ 비활성화", () =>
                    setFaqStatus(faqId, "INACTIVE"),
                  );
                }
                setDeactivatingFaqId(null);
              }}
            >
              비활성화
            </Button>
          </>
        }
      >
        {deactivatingFaq && (
          <p className="bg-surface-muted rounded-2xl p-4 text-sm font-bold text-gray-700 dark:bg-white/5 dark:text-gray-200">
            {deactivatingFaq.question}
          </p>
        )}
      </Modal>

      <Modal
        isOpen={activatingFaq !== undefined}
        onClose={() => setActivatingFaqId(null)}
        title="FAQ를 활성화할까요?"
        description="활성화된 FAQ는 다시 사용자 검색 및 RAG 답변 대상에 포함됩니다."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivatingFaqId(null)}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (activatingFaq) {
                  const faqId = activatingFaq.faqId;
                  void runWithStatus("FAQ 활성화", () =>
                    setFaqStatus(faqId, "ACTIVE"),
                  );
                }
                setActivatingFaqId(null);
              }}
            >
              활성화
            </Button>
          </>
        }
      >
        {activatingFaq && (
          <p className="bg-surface-muted rounded-2xl p-4 text-sm font-bold text-gray-700 dark:bg-white/5 dark:text-gray-200">
            {activatingFaq.question}
          </p>
        )}
      </Modal>

      <Modal
        isOpen={deletingFaq !== undefined}
        onClose={() => {
          setDeletingFaqId(null);
          setIsFaqDeleteAcknowledged(false);
        }}
        title="FAQ를 삭제할까요?"
        description="API 명세에 따라 실제 row를 지우지 않고 INACTIVE로 전환합니다. 사용자 검색 및 RAG 답변 대상에서는 제외됩니다."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeletingFaqId(null);
                setIsFaqDeleteAcknowledged(false);
              }}
            >
              취소
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!isFaqDeleteAcknowledged}
              // 체크 전에는 눌러도 막혀 있다는 게 바로 보이도록 자물쇠
              // 아이콘을 같이 보여줍니다. 체크 여부가 바뀔 때 아이콘이
              // 부드럽게 사라지고 나타나도록 애니메이션을 줘요.
              leftIcon={
                <AnimatedLockIcon show={!isFaqDeleteAcknowledged} size={16} />
              }
              onClick={() => {
                if (!deletingFaq || !isFaqDeleteAcknowledged) return;
                const faqId = deletingFaq.faqId;
                void runWithStatus("FAQ 삭제", () => deleteFaq(faqId));
                setDeletingFaqId(null);
                setIsFaqDeleteAcknowledged(false);
              }}
            >
              삭제
            </Button>
          </>
        }
      >
        {deletingFaq && (
          <div className="space-y-4">
            <p className="bg-surface-muted rounded-2xl p-4 text-sm font-bold text-gray-700 dark:bg-white/5 dark:text-gray-200">
              {deletingFaq.question}
            </p>
            <ConfirmCheckbox
              checked={isFaqDeleteAcknowledged}
              onChange={(event) =>
                setIsFaqDeleteAcknowledged(event.target.checked)
              }
            >
              FAQ 삭제가 비활성화 처리로 반영됨을 확인했습니다.
            </ConfirmCheckbox>
          </div>
        )}
      </Modal>
    </div>
  );
};

type FaqFormModalProps = {
  initialValues?: AdminFaq;
  isOpen: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSave?: (input: {
    answer: string;
    category: AdminFaqCategory;
    question: string;
    subcategory?: string;
  }) => void;
};

const FaqFormModal = ({
  initialValues,
  isOpen,
  mode,
  onClose,
  onSave,
}: FaqFormModalProps) => {
  const formId = `faq-${mode}-form`;
  const [selectedCategory, setSelectedCategory] = useState(
    initialValues?.category ?? "",
  );
  const subcategoryOptions = getFaqSubcategoryOptions(selectedCategory);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const answer = String(formData.get("answer") ?? "").trim();
    const category = String(formData.get("category") ?? "") as AdminFaqCategory;
    const question = String(formData.get("question") ?? "").trim();
    const subcategory = String(formData.get("subcategory") ?? "").trim();

    if (!category || !question || !answer) {
      showToast("카테고리, 질문, 답변을 입력해 주세요.");
      return;
    }

    onSave?.({
      answer,
      category,
      question,
      subcategory: subcategory || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "FAQ 등록" : "FAQ 수정"}
      description="운영 중 개별 FAQ를 추가하거나 수정합니다. 질문/답변 변경 시 임베딩도 함께 갱신됩니다."
      size="lg"
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" form={formId} type="submit">
            {mode === "create" ? "등록" : "저장"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <AdminField
          label="카테고리"
          name="category"
          defaultValue={initialValues?.category}
          options={faqCategoryOptions}
          placeholder="카테고리 선택"
          onChange={(event) => setSelectedCategory(event.target.value)}
          required
        />
        <AdminField
          key={selectedCategory || "subcategory"}
          label="세부 주제"
          name="subcategory"
          defaultValue={
            subcategoryOptions.some(
              (option) => option.value === initialValues?.subcategory,
            )
              ? initialValues?.subcategory
              : undefined
          }
          options={subcategoryOptions}
          placeholder={
            selectedCategory ? "세부 주제 선택" : "카테고리를 먼저 선택"
          }
          description="선택한 카테고리에 속한 세부 주제만 저장할 수 있습니다."
        />
        <AdminField
          label="질문"
          name="question"
          defaultValue={initialValues?.question}
          placeholder="예: 해외 로밍 데이터는 언제부터 적용되나요?"
          className="sm:col-span-2"
          required
        />
        <AdminField
          label="답변"
          name="answer"
          defaultValue={initialValues?.answer}
          placeholder="예: 로밍 요금제는 신청한 시작일 0시부터 적용되며, 국가별 제공량과 요금은 상품에 따라 달라질 수 있습니다."
          className="sm:col-span-2"
          multiline
          required
        />
      </form>
    </Modal>
  );
};

const FaqSkeletonRow = () => (
  <tr className="h-20" aria-hidden="true">
    <td className="px-5 py-4">
      <div className="bg-surface-muted h-4 w-12 animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-4 py-4">
      <div className="bg-surface-muted h-4 w-[min(360px,80%)] animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-4 py-4">
      <div className="bg-surface-muted h-4 w-24 animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-4 py-4">
      <div className="bg-surface-muted mx-auto h-4 w-20 animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-4 py-4">
      <div className="bg-surface-muted mx-auto h-4 w-20 animate-pulse rounded-full dark:bg-white/10" />
    </td>
    <td className="px-5 py-4">
      <div className="mx-auto flex justify-center gap-3">
        <div className="bg-surface-muted h-10 w-10 animate-pulse rounded-lg dark:bg-white/10" />
        <div className="bg-surface-muted h-10 w-24 animate-pulse rounded-lg dark:bg-white/10" />
        <div className="bg-surface-muted h-10 w-10 animate-pulse rounded-lg dark:bg-white/10" />
      </div>
    </td>
  </tr>
);

const FaqSkeletonCard = () => (
  <Card padding="sm" aria-hidden="true">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-3">
        <div className="bg-surface-muted h-4 w-full animate-pulse rounded-full dark:bg-white/10" />
        <div className="bg-surface-muted h-3 w-2/3 animate-pulse rounded-full dark:bg-white/10" />
      </div>
    </div>
  </Card>
);

type FaqPaginationProps = {
  currentPage: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  totalPages: number;
};

const FaqPagination = ({
  currentPage,
  disabled = false,
  onPageChange,
  totalPages,
}: FaqPaginationProps) => {
  const pages = getVisiblePages(currentPage, totalPages);
  const [jumpValue, setJumpValue] = useState("");

  const handleJumpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPage = Number(jumpValue);

    if (!Number.isInteger(nextPage)) return;

    onPageChange(Math.min(totalPages, Math.max(1, nextPage)));
    setJumpValue("");
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pt-2 md:pt-0">
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          className="h-8 w-8 rounded-lg p-0 disabled:pointer-events-none disabled:opacity-30"
          disabled={currentPage === 1 || disabled}
          aria-label="이전 페이지"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft size={15} />
        </Button>
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 min-w-8 items-center justify-center px-1 text-sm font-extrabold text-gray-400"
            >
              ...
            </span>
          ) : (
            <PaginationPageButton
              key={page}
              disabled={disabled}
              isActive={page === currentPage}
              page={page}
              onClick={() => onPageChange(page)}
            />
          ),
        )}
        <Button
          variant="ghost"
          size="xs"
          className="h-8 w-8 rounded-lg p-0 disabled:pointer-events-none disabled:opacity-30"
          disabled={currentPage === totalPages || disabled}
          aria-label="다음 페이지"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight size={15} />
        </Button>
      </div>

      {totalPages > 7 && (
        <form className="flex items-center gap-1.5" onSubmit={handleJumpSubmit}>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            disabled={disabled}
            placeholder="페이지"
            onChange={(event) => setJumpValue(event.target.value)}
            className="border-border focus:border-brand h-8 w-20 rounded-lg border bg-white px-2 text-center text-xs font-bold text-gray-700 transition outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
          />
          <Button
            variant="secondary"
            size="xs"
            type="submit"
            disabled={disabled || !jumpValue}
            className="h-8 rounded-lg px-2"
          >
            이동
          </Button>
        </form>
      )}
    </div>
  );
};

type PaginationItem = number | "ellipsis";

const getVisiblePages = (
  currentPage: number,
  totalPages: number,
): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  const pages: PaginationItem[] = [1];

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
};

type PaginationPageButtonProps = {
  disabled?: boolean;
  isActive: boolean;
  onClick: () => void;
  page: number;
};

const PaginationPageButton = ({
  disabled,
  isActive,
  onClick,
  page,
}: PaginationPageButtonProps) => (
  <button
    type="button"
    aria-label={`${page}페이지`}
    aria-current={isActive ? "page" : undefined}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-extrabold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
      isActive
        ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white",
    )}
  >
    {page}
  </button>
);

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};
