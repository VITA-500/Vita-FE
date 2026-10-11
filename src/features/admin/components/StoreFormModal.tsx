"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { type FieldErrors, useForm, useWatch } from "react-hook-form";
import { AdminControlledField } from "@/features/admin/components/AdminControlledField";
import {
  storeFormSchema,
  type StoreFormValues,
} from "@/features/admin/lib/adminFormSchemas";
import type {
  AdminBenefit,
  AdminStoreDetail,
  AdminStoreType,
} from "@/features/admin/types";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { showToast } from "@/shared/ui/ToastProvider";

export type StoreInput = Omit<
  AdminStoreDetail,
  | "brand"
  | "category"
  | "benefitName"
  | "createdAt"
  | "storeId"
  | "storeType"
  | "updatedAt"
>;

type StoreFormModalProps = {
  benefits: AdminBenefit[];
  isOpen: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (input: StoreInput) => Promise<void>;
  storeLabel: string;
  storeType: AdminStoreType;
  store?: AdminStoreDetail;
};

export const StoreFormModal = ({
  benefits,
  isOpen,
  mode,
  onClose,
  onSave,
  store,
  storeLabel,
  storeType,
}: StoreFormModalProps) => {
  const formId = mode === "create" ? "store-create-form" : "store-edit-form";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPartnerStore = storeType === "PARTNER";
  const benefitOptions = benefits.map((benefit) => ({
    label: `${benefit.brand} · ${benefit.name}`,
    value: String(benefit.benefitId),
  }));
  const placeholders = isPartnerStore
    ? {
        address: "예: 서울 송파구 올림픽로 240",
        businessHours: "예: 09:00~18:00",
        consultServices: "입장권 문의, 예약 변경",
        name: "예: 어진월드 어드벤처",
        phone: "예: 02-9876-5432",
        providedServices: "제휴 할인, 현장 결제",
      }
    : {
        address: "예: 서울 강남구 테헤란로 111",
        businessHours: "예: 10:00~20:00",
        consultServices: "휴대폰상담, 요금제변경",
        name: "예: VITA 강남점",
        phone: "예: 02-1234-5678",
        providedServices: "유심발급, 기기변경",
      };
  const fieldLabels = isPartnerStore
    ? {
        consultServices: "이용 안내",
        providedServices: "제휴 제공 내용",
      }
    : {
        consultServices: "상담 가능 업무",
        providedServices: "제공 가능 서비스",
      };
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<StoreFormValues>({
    defaultValues: {
      address: store?.address ?? "",
      benefitId: store?.benefitId ? String(store.benefitId) : "",
      businessHours: store?.businessHours ?? "",
      consultServices: store?.consultServices.join(", ") ?? "",
      lat: store ? String(store.lat) : "",
      lng: store ? String(store.lng) : "",
      name: store?.name ?? "",
      phone: store?.phone ?? "",
      providedServices: store?.providedServices.join(", ") ?? "",
    },
    mode: "onChange",
    resolver: zodResolver(storeFormSchema),
  });
  const selectedBenefitId = useWatch({ control, name: "benefitId" });
  const canSubmit = isValid && (!isPartnerStore || Boolean(selectedBenefitId));
  const validationMessage =
    errorMessage ??
    errors.benefitId?.message ??
    errors.businessHours?.message ??
    errors.phone?.message;

  useEffect(() => {
    reset({
      address: store?.address ?? "",
      benefitId: store?.benefitId ? String(store.benefitId) : "",
      businessHours: store?.businessHours ?? "",
      consultServices: store?.consultServices.join(", ") ?? "",
      lat: store ? String(store.lat) : "",
      lng: store ? String(store.lng) : "",
      name: store?.name ?? "",
      phone: store?.phone ?? "",
      providedServices: store?.providedServices.join(", ") ?? "",
    });
  }, [reset, store]);

  const submitStore = async (values: StoreFormValues) => {
    setErrorMessage(null);

    if (isPartnerStore && !values.benefitId?.trim()) {
      const message = "제휴 브랜드를 선택해 주세요.";
      setError("benefitId", { message, type: "manual" });
      showToast(message);
      return;
    }

    clearErrors("benefitId");
    setIsSubmitting(true);

    try {
      await onSave({
        address: values.address.trim(),
        benefitId: parseOptionalNumber(values.benefitId),
        businessHours: values.businessHours?.trim() ?? "",
        consultServices: toServiceArray(values.consultServices),
        lat: Number(values.lat.trim()),
        lng: Number(values.lng.trim()),
        name: values.name.trim(),
        phone: values.phone?.trim() ?? "",
        providedServices: toServiceArray(values.providedServices),
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `${storeLabel} 정보를 저장하지 못했습니다.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalidSubmit = (formErrors: FieldErrors<StoreFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;

    showToast(
      typeof firstMessage === "string"
        ? firstMessage
        : `${storeLabel} 정보를 다시 확인해 주세요.`,
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "create"
          ? `${storeLabel} 추가`
          : `${store?.name ?? storeLabel} 수정`
      }
      description={`백엔드 관리자 API에 저장할 ${storeLabel} 정보를 입력해 주세요.`}
      size="lg"
      className="max-h-[calc(100svh-48px)] overflow-y-auto"
    >
      {mode === "edit" && store && (
        <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1 rounded-2xl bg-gray-50 px-4 py-3 text-xs font-bold text-gray-400 dark:bg-white/5">
          <span>등록일 {formatKoreanDate(store.createdAt)}</span>
          <span>
            수정일{" "}
            {store.updatedAt
              ? formatKoreanDate(store.updatedAt)
              : "수정 이력 없음"}
          </span>
        </div>
      )}

      <form
        id={formId}
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit(submitStore, handleInvalidSubmit)}
      >
        <AdminControlledField
          control={control}
          name="name"
          label={`${storeLabel}명`}
          placeholder={placeholders.name}
          className="sm:col-span-2"
          required
        />
        <AdminControlledField
          control={control}
          name="address"
          label="주소"
          placeholder={placeholders.address}
          className="sm:col-span-2"
          required
        />
        <AdminControlledField
          control={control}
          name="lat"
          label="위도"
          inputMode="decimal"
          placeholder="37.2660"
          required
          step="any"
          type="number"
        />
        <AdminControlledField
          control={control}
          name="lng"
          label="경도"
          inputMode="decimal"
          placeholder="127.0000"
          required
          step="any"
          type="number"
        />
        <AdminControlledField
          control={control}
          name="businessHours"
          label="운영시간"
          placeholder={placeholders.businessHours}
        />
        <AdminControlledField
          control={control}
          name="phone"
          label="전화번호"
          placeholder={placeholders.phone}
        />
        {isPartnerStore && (
          <AdminControlledField
            control={control}
            name="benefitId"
            label="제휴 브랜드"
            options={benefitOptions}
            placeholder="제휴 브랜드 선택"
            required
            className="sm:col-span-2"
            description="백엔드 제휴 혜택 API의 benefitId로 연결됩니다."
          />
        )}
        <AdminControlledField
          control={control}
          name="consultServices"
          label={fieldLabels.consultServices}
          placeholder={placeholders.consultServices}
          className="sm:col-span-2"
        />
        <AdminControlledField
          control={control}
          name="providedServices"
          label={fieldLabels.providedServices}
          placeholder={placeholders.providedServices}
          className="sm:col-span-2"
        />
      </form>

      {validationMessage && (
        <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {validationMessage}
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button
          size="sm"
          form={formId}
          type="submit"
          disabled={!canSubmit}
          isLoading={isSubmitting}
        >
          {mode === "create" ? "추가" : "저장"}
        </Button>
      </div>
    </Modal>
  );
};

const parseOptionalNumber = (value?: string) => {
  const text = String(value ?? "").trim();

  if (!text) return undefined;

  const numberValue = Number(text);

  if (!Number.isFinite(numberValue)) {
    throw new Error("제휴 브랜드를 다시 선택해 주세요.");
  }

  return numberValue;
};

const toServiceArray = (value?: string) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
