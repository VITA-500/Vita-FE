"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { AdminControlledField } from "@/features/admin/common/components/AdminControlledField";
import {
  benefitFormSchema,
  type BenefitFormValues,
} from "@/features/admin/common/lib/adminFormSchemas";
import {
  adminBenefitCategories,
  type AdminBenefitCategory,
  type AdminBenefitDetail,
  type AdminBenefitRequest,
} from "@/features/admin/types";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/atoms/Button";
import { Modal } from "@/shared/ui/organisms/Modal";
import type { SelectOption } from "@/shared/ui/atoms/Select";
import { showToast } from "@/shared/providers/ToastProvider";

const benefitCategoryOptions: readonly SelectOption[] =
  adminBenefitCategories.map((category) => ({
    label: category,
    value: category,
  }));

const isBenefitCategory = (value: string): value is AdminBenefitCategory =>
  (adminBenefitCategories as readonly string[]).includes(value);

const toFormValues = (benefit?: AdminBenefitDetail) => ({
  brand: benefit?.brand ?? "",
  category:
    benefit && isBenefitCategory(benefit.category)
      ? benefit.category
      : undefined,
  description: benefit?.description ?? "",
  name: benefit?.name ?? "",
});

type BenefitFormModalProps = {
  initialValues?: AdminBenefitDetail;
  isOpen: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (input: AdminBenefitRequest) => void;
};

/** 제휴 혜택(브랜드) 등록·수정 모달 */
export const BenefitFormModal = ({
  initialValues,
  isOpen,
  mode,
  onClose,
  onSave,
}: BenefitFormModalProps) => {
  const formId = `benefit-${mode}-form`;
  const {
    control,
    formState: { isValid },
    handleSubmit,
    reset,
  } = useForm<BenefitFormValues>({
    defaultValues: toFormValues(initialValues),
    mode: "onChange",
    resolver: zodResolver(benefitFormSchema),
  });

  useEffect(() => {
    reset(toFormValues(initialValues));
  }, [initialValues, isOpen, reset]);

  const submitBenefit = (values: BenefitFormValues) => {
    onSave({
      brand: values.brand.trim(),
      category: values.category,
      description: values.description?.trim() || null,
      name: values.name.trim(),
    });
  };

  const handleInvalidSubmit = (formErrors: FieldErrors<BenefitFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;

    showToast(
      typeof firstMessage === "string"
        ? firstMessage
        : "브랜드명, 혜택 이름, 카테고리를 입력해 주세요.",
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "제휴 혜택 등록" : "제휴 혜택 수정"}
      description="제휴 브랜드와 혜택을 등록하면 제휴점 관리에서 매장에 연결할 수 있어요."
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
          <span>수정일 {formatKoreanDate(initialValues.updatedAt)}</span>
          <span>
            연결 매장 {initialValues.storeCount.toLocaleString("ko-KR")}곳
          </span>
        </div>
      )}

      <form
        id={formId}
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit(submitBenefit, handleInvalidSubmit)}
      >
        <AdminControlledField
          control={control}
          name="brand"
          label="브랜드명"
          placeholder="예: 스타벅스"
          description={
            mode === "edit"
              ? "바꿔도 연결된 제휴 매장은 그대로 유지돼요."
              : "다른 혜택과 같은 브랜드명은 쓸 수 없어요."
          }
          required
        />
        <AdminControlledField
          control={control}
          name="category"
          label="카테고리"
          options={benefitCategoryOptions}
          placeholder="카테고리 선택"
          required
        />
        <AdminControlledField
          control={control}
          name="name"
          label="혜택 이름"
          placeholder="예: 아메리카노 사이즈 업"
          className="sm:col-span-2"
          required
        />
        <AdminControlledField
          control={control}
          name="description"
          label="혜택 설명 (선택)"
          placeholder="예: VITA 회원 인증 시 톨 사이즈 음료를 그란데로 업그레이드해 드려요."
          className="sm:col-span-2"
          multiline
        />
      </form>
    </Modal>
  );
};
