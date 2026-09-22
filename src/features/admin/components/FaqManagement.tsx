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
import { type FormEvent, useMemo, useState } from "react";
import { FilterDropdown } from "@/features/admin/components/FilterDropdown";
import { SortDropdown } from "@/features/admin/components/SortDropdown";
import { useActionStatus } from "@/features/admin/context/ActionStatusContext";
import { useAdminData } from "@/features/admin/context/AdminDataContext";
import {
  adminFaqCategories,
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
import { Select, type SelectOption } from "@/shared/ui/Select";

const faqCategoryOptions: readonly SelectOption[] = adminFaqCategories.map(
  (category) => ({ label: category, value: category }),
);

type FaqCategoryFilter = "ALL" | AdminFaqCategory;

const faqCategoryFilterOptions: readonly SelectOption[] = [
  { label: "전체", value: "ALL" },
  ...faqCategoryOptions,
];

const FAQ_PAGE_SIZE = 7;

export const FaqManagement = () => {
  const { addFaq, deleteFaq, faqs, saveFaq, setFaqStatus } = useAdminData();
  const { runWithStatus } = useActionStatus();
  const [selectedFaqIds, setSelectedFaqIds] = useState<number[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [deactivatingFaqId, setDeactivatingFaqId] = useState<number | null>(
    null,
  );
  const [activatingFaqId, setActivatingFaqId] = useState<number | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null);
  const [isFaqDeleteAcknowledged, setIsFaqDeleteAcknowledged] = useState(false);
  const [categoryFilter, setCategoryFilter] =
    useState<FaqCategoryFilter>("ALL");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortLabel, setSortLabel] = useState("이름순");

  const visibleFaqRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return faqs
      .filter((faq) =>
        categoryFilter === "ALL" ? true : faq.category === categoryFilter,
      )
      .filter((faq) => {
        if (!normalizedKeyword) return true;
        // subcategory는 테이블에 노출되지 않는 값이라, 검색어로 매칭돼도
        // 사용자 입장에서는 왜 걸렸는지 알 수 없는 결과가 섞여 나왔어요.
        // 화면에 실제로 보이는 질문/카테고리만 검색 대상으로 삼습니다.
        return [faq.question, faq.category]
          .join(" ")
          .toLowerCase()
          .includes(normalizedKeyword);
      })
      .toSorted((a, b) => {
        if (sortLabel === "등록순") {
          return b.createdAt.localeCompare(a.createdAt);
        }

        return a.question.localeCompare(b.question, "ko");
      });
  }, [categoryFilter, faqs, keyword, sortLabel]);

  const isAllSelected =
    visibleFaqRows.length > 0 &&
    visibleFaqRows
      .slice((currentPage - 1) * FAQ_PAGE_SIZE, currentPage * FAQ_PAGE_SIZE)
      .every((faq) => selectedFaqIds.includes(faq.faqId));
  const totalPages = Math.max(
    1,
    Math.ceil(visibleFaqRows.length / FAQ_PAGE_SIZE),
  );
  const paginatedFaqRows = visibleFaqRows.slice(
    (currentPage - 1) * FAQ_PAGE_SIZE,
    currentPage * FAQ_PAGE_SIZE,
  );
  const editingFaq = faqs.find((faq) => faq.faqId === editingFaqId);
  const deactivatingFaq = faqs.find((faq) => faq.faqId === deactivatingFaqId);
  const activatingFaq = faqs.find((faq) => faq.faqId === activatingFaqId);
  const deletingFaq = faqs.find((faq) => faq.faqId === deletingFaqId);

  const toggleAllFaqs = () => {
    setSelectedFaqIds((currentIds) =>
      isAllSelected
        ? currentIds.filter(
            (id) => !paginatedFaqRows.some((faq) => faq.faqId === id),
          )
        : Array.from(
            new Set([
              ...currentIds,
              ...paginatedFaqRows.map((faq) => faq.faqId),
            ]),
          ),
    );
  };

  const toggleFaq = (faqId: number) => {
    setSelectedFaqIds((currentIds) =>
      currentIds.includes(faqId)
        ? currentIds.filter((currentId) => currentId !== faqId)
        : [...currentIds, faqId],
    );
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

      <div className="mb-7 grid gap-3 lg:grid-cols-[minmax(280px,420px)_auto] lg:items-start lg:justify-between">
        <SearchInput
          placeholder="질문이나 키워드를 검색하세요"
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setCurrentPage(1);
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <FilterDropdown
            aria-label="카테고리 필터"
            className="w-full sm:w-[160px]"
            options={faqCategoryFilterOptions}
            value={categoryFilter}
            onChange={(nextValue) => {
              setCategoryFilter(nextValue as FaqCategoryFilter);
              setCurrentPage(1);
            }}
          />
          <SortDropdown
            options={["이름순", "등록순"]}
            value={sortLabel}
            onChange={(nextValue) => {
              setSortLabel(nextValue);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div
          className={cn(
            "overflow-x-auto",
            // 행 높이를 맞추는 것만으로는 헤더/구분선 두께 같은 미세한 픽셀
            // 오차가 남아서 페이지마다 테이블 아래쪽이 살짝씩 어긋나 보였어요.
            // 그래서 이 영역 자체를 고정 높이(헤더 48px + 7행×80px + 구분선
            // 6px)로 못박고 세로 오버플로우는 숨겨서, 오차가 있어도 항상
            // 정확히 같은 높이로 보이게 합니다.
            visibleFaqRows.length > 0 && "h-[614px] overflow-y-hidden",
          )}
        >
          <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
            <thead className="bg-surface-muted text-xs font-extrabold text-gray-400 dark:bg-white/5">
              <tr>
                <th className="w-12 px-5 py-4 text-left">
                  <div className="pl-3">
                    <input
                      type="checkbox"
                      aria-label="전체 FAQ 선택"
                      checked={isAllSelected}
                      onChange={toggleAllFaqs}
                    />
                  </div>
                </th>
                <th className="w-[45%] px-4 py-4 text-left">질문</th>
                <th className="w-[18%] px-4 py-4 text-left">카테고리</th>
                <th className="w-[17%] px-4 py-4 text-center">등록일</th>
                <th className="w-[20%] px-5 py-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-border-soft divide-y dark:divide-white/10">
              {visibleFaqRows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm font-semibold text-gray-400"
                  >
                    조건에 맞는 FAQ가 없습니다.
                  </td>
                </tr>
              )}
              {paginatedFaqRows.map((faq) => (
                <tr
                  key={faq.faqId}
                  className="hover:bg-surface-muted/70 h-20 transition dark:hover:bg-white/5"
                >
                  <td className="px-5 py-4">
                    <div className="pl-3">
                      <input
                        type="checkbox"
                        aria-label={`${faq.faqId}번 FAQ 선택`}
                        checked={selectedFaqIds.includes(faq.faqId)}
                        onChange={() => toggleFaq(faq.faqId)}
                      />
                    </div>
                  </td>
                  <td className="truncate px-4 py-4 font-bold text-gray-800 dark:text-gray-100">
                    {faq.question}
                  </td>
                  <td className="truncate px-4 py-4 text-gray-500">
                    {faq.category}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-500">
                    {faq.createdAt.slice(0, 10)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center gap-2 pr-3">
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
                          className="h-12 w-12 rounded-lg p-0"
                          aria-label="FAQ 비활성화"
                          onClick={() => setDeactivatingFaqId(faq.faqId)}
                        >
                          <EyeOff size={30} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-12 w-12 rounded-lg p-0 text-green-500 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-500/10 dark:hover:text-green-300"
                          aria-label="FAQ 활성화"
                          onClick={() => setActivatingFaqId(faq.faqId)}
                        >
                          <Eye size={30} />
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
              {paginatedFaqRows.length > 0 &&
                paginatedFaqRows.length < FAQ_PAGE_SIZE &&
                Array.from({
                  length: FAQ_PAGE_SIZE - paginatedFaqRows.length,
                }).map((_, index) => (
                  <tr
                    key={`filler-${index}`}
                    aria-hidden="true"
                    className="h-20"
                  >
                    <td colSpan={5} />
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {visibleFaqRows.length > 0 && (
          <div className="border-border-soft flex items-center justify-center gap-1 border-t px-5 py-4 dark:border-white/10">
            <Button
              variant="ghost"
              size="xs"
              className="h-8 w-8 rounded-lg p-0 disabled:pointer-events-none disabled:opacity-30"
              disabled={currentPage === 1}
              aria-label="이전 페이지"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft size={15} />
            </Button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => {
                const isActive = page === currentPage;

                return (
                  <button
                    key={page}
                    type="button"
                    aria-label={`${page}페이지`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-extrabold transition-colors duration-150",
                      isActive
                        ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white",
                    )}
                  >
                    {page}
                  </button>
                );
              },
            )}
            <Button
              variant="ghost"
              size="xs"
              className="h-8 w-8 rounded-lg p-0 disabled:pointer-events-none disabled:opacity-30"
              disabled={currentPage === totalPages}
              aria-label="다음 페이지"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              <ChevronRight size={15} />
            </Button>
          </div>
        )}
      </Card>

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const category = formData.get("category") as AdminFaqCategory;
    const question = String(formData.get("question") ?? "").trim();
    const subcategory = String(formData.get("subcategory") ?? "").trim();

    onSave?.({
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
        <FaqField
          label="카테고리"
          name="category"
          value={initialValues?.category}
          options={faqCategoryOptions}
          placeholder="카테고리 선택"
        />
        <FaqField
          label="세부 주제"
          name="subcategory"
          value={initialValues?.subcategory}
          placeholder="예: 데이터 로밍, 가족 결합, 유심 재발급"
          description="카테고리 안에서 FAQ를 더 좁혀 구분하는 선택 입력값입니다."
        />
        <FaqField
          label="질문"
          name="question"
          value={initialValues?.question}
          placeholder="예: 해외 로밍 데이터는 언제부터 적용되나요?"
          className="sm:col-span-2"
          required
        />
        <FaqField
          label="답변"
          name="answer"
          placeholder="예: 로밍 요금제는 신청한 시작일 0시부터 적용되며, 국가별 제공량과 요금은 상품에 따라 달라질 수 있습니다."
          className="sm:col-span-2"
          multiline
        />
      </form>
    </Modal>
  );
};

type FaqFieldProps = {
  className?: string;
  label: string;
  multiline?: boolean;
  name: string;
  options?: readonly SelectOption[];
  placeholder?: string;
  required?: boolean;
  value?: string;
  description?: string;
};

const FaqField = ({
  className,
  description,
  label,
  multiline = false,
  name,
  options,
  placeholder,
  required = false,
  value,
}: FaqFieldProps) => (
  <label className={className}>
    <span className="mb-2 block text-xs font-extrabold text-gray-500">
      {label}
    </span>
    {options ? (
      <Select
        name={name}
        options={options}
        defaultValue={value}
        placeholder={placeholder}
        required={required}
      />
    ) : multiline ? (
      <textarea
        defaultValue={value}
        name={name}
        placeholder={placeholder}
        required={required}
        rows={5}
        className="border-border focus:border-brand focus:ring-brand/10 h-auto w-full rounded-xl border bg-white px-3 py-3 text-sm font-semibold text-gray-700 transition outline-none placeholder:font-medium placeholder:text-gray-400 focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
      />
    ) : (
      <input
        defaultValue={value}
        name={name}
        placeholder={placeholder}
        required={required}
        className="border-border focus:border-brand focus:ring-brand/10 h-10 w-full rounded-xl border bg-white px-3 text-sm font-semibold text-gray-700 transition outline-none placeholder:font-medium placeholder:text-gray-400 focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
      />
    )}
    {description && (
      <span className="mt-2 block text-xs leading-5 font-semibold text-gray-400">
        {description}
      </span>
    )}
  </label>
);
