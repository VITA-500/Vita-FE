"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type FieldErrors, useForm, useWatch } from "react-hook-form";
import { AdminControlledField } from "@/features/admin/components/AdminControlledField";
import {
  faqFormSchema,
  type FaqFormValues,
} from "@/features/admin/lib/adminFormSchemas";
import {
  adminFaqCategories,
  adminFaqSubcategories,
  type AdminFaq,
  type AdminFaqCategory,
} from "@/features/admin/types";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
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

export type FaqFormInput = {
  answer: string;
  category: AdminFaqCategory;
  question: string;
  subcategory?: string;
};

type FaqFormModalProps = {
  initialValues?: AdminFaq;
  isOpen: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSave?: (input: FaqFormInput) => void;
};

export const FaqFormModal = ({
  initialValues,
  isOpen,
  mode,
  onClose,
  onSave,
}: FaqFormModalProps) => {
  const formId = `faq-${mode}-form`;
  const {
    control,
    formState: { isValid },
    handleSubmit,
    reset,
  } = useForm<FaqFormValues>({
    defaultValues: {
      answer: initialValues?.answer ?? "",
      category: initialValues?.category,
      question: initialValues?.question ?? "",
      subcategory: initialValues?.subcategory ?? "",
    },
    mode: "onChange",
    resolver: zodResolver(faqFormSchema),
  });
  const selectedCategory = useWatch({ control, name: "category" });
  const subcategoryOptions = getFaqSubcategoryOptions(selectedCategory);

  useEffect(() => {
    reset({
      answer: initialValues?.answer ?? "",
      category: initialValues?.category,
      question: initialValues?.question ?? "",
      subcategory: initialValues?.subcategory ?? "",
    });
  }, [initialValues, reset]);

  const submitFaq = (values: FaqFormValues) => {
    onSave?.({
      answer: values.answer.trim(),
      category: values.category,
      question: values.question.trim(),
      subcategory: values.subcategory?.trim() || undefined,
    });
  };

  const handleInvalidSubmit = (formErrors: FieldErrors<FaqFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;

    showToast(
      typeof firstMessage === "string"
        ? firstMessage
        : "카테고리, 질문, 답변을 입력해 주세요.",
    );
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
          <Button size="sm" form={formId} type="submit" disabled={!isValid}>
            {mode === "create" ? "등록" : "저장"}
          </Button>
        </>
      }
    >
      {mode === "edit" && initialValues && (
        <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1 rounded-2xl bg-gray-50 px-4 py-3 text-xs font-bold text-gray-400 dark:bg-white/5">
          <span>등록일 {formatKoreanDate(initialValues.createdAt)}</span>
          <span>
            수정일{" "}
            {initialValues.updatedAt
              ? formatKoreanDate(initialValues.updatedAt)
              : "수정 이력 없음"}
          </span>
        </div>
      )}

      <form
        id={formId}
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit(submitFaq, handleInvalidSubmit)}
      >
        <AdminControlledField
          control={control}
          name="category"
          label="카테고리"
          options={faqCategoryOptions}
          placeholder="카테고리 선택"
          required
        />
        <AdminControlledField
          key={selectedCategory || "subcategory"}
          control={control}
          name="subcategory"
          formatValue={(value) =>
            subcategoryOptions.some((option) => option.value === value)
              ? String(value)
              : ""
          }
          label="세부 주제 (선택)"
          options={subcategoryOptions}
          placeholder={
            selectedCategory ? "세부 주제 선택" : "카테고리를 먼저 선택"
          }
          description="선택하지 않아도 등록할 수 있습니다."
        />
        <AdminControlledField
          control={control}
          name="question"
          label="질문"
          placeholder="예: 해외 로밍 데이터는 언제부터 적용되나요?"
          className="sm:col-span-2"
          required
        />
        <AdminControlledField
          control={control}
          name="answer"
          label="답변"
          placeholder="예: 로밍 요금제는 신청한 시작일 0시부터 적용되며, 국가별 제공량과 요금은 상품에 따라 달라질 수 있습니다."
          className="sm:col-span-2"
          multiline
          required
        />
      </form>
    </Modal>
  );
};
