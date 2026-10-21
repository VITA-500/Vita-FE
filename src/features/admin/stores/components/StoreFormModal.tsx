"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { type FieldErrors, useForm, useWatch } from "react-hook-form";
import { AdminControlledField } from "@/features/admin/common/components/AdminControlledField";
import {
  storeFormSchema,
  type StoreFormValues,
} from "@/features/admin/common/lib/adminFormSchemas";
import { formatKoreanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/atoms/Button";
import { Modal } from "@/shared/ui/organisms/Modal";
import { showToast } from "@/shared/providers/ToastProvider";
import type { BenefitSummary as AdminBenefit } from "@/entities/benefit";
import type {
  AdminStoreDetail,
  AdminStoreFormInput,
  AdminStoreType,
} from "@/entities/store";

export type StoreInput = AdminStoreFormInput;

const hours = Array.from({ length: 24 }, (_, value) =>
  String(value).padStart(2, "0"),
);
const minutes = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, "0"),
);

const TimePicker = ({
  label,
  value,
  isOpen,
  onToggle,
  onClose,
  onChange,
}: {
  label: string;
  value: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
}) => {
  const [hour, minute] = value.split(":");
  const selectHour = (nextHour: string) =>
    onChange(`${nextHour}:${minute || "00"}`);
  const selectMinute = (nextMinute: string) => {
    onChange(`${hour || "00"}:${nextMinute}`);
    onClose();
  };

  return (
    <div className="relative min-w-0 flex-1">
      <span className="mb-2 block text-xs font-extrabold text-gray-500">
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="border-border hover:border-brand/40 focus-visible:ring-brand/30 flex h-12 w-full items-center justify-between gap-2 rounded-2xl border bg-white px-4 text-sm font-extrabold text-gray-700 shadow-sm transition hover:text-gray-950 focus-visible:ring-2 focus-visible:outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:text-white"
      >
        <span>{value || "시간 선택"}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-border-soft absolute top-full left-0 z-30 mt-2 grid w-full min-w-[240px] grid-cols-2 gap-2 rounded-2xl border bg-white p-2 shadow-lg dark:border-white/10 dark:bg-zinc-950">
          <div className="bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand col-span-2 rounded-xl px-3 py-2 text-center text-sm font-black">
            {value || "시간을 선택해 주세요"}
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            <p className="px-2 py-1 text-xs font-extrabold text-gray-400">시</p>
            {hours.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => selectHour(option)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${hour === option ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand" : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/10"}`}
              >
                {option}시
                {hour === option && <Check size={14} className="text-brand" />}
              </button>
            ))}
          </div>
          <div className="max-h-56 space-y-1 overflow-y-auto">
            <p className="px-2 py-1 text-xs font-extrabold text-gray-400">분</p>
            {minutes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => selectMinute(option)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${minute === option ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand" : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/10"}`}
              >
                {option}분
                {minute === option && (
                  <Check size={14} className="text-brand" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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
  const validationRef = useRef<HTMLParagraphElement>(null);
  const [openTimePicker, setOpenTimePicker] = useState<
    "opening" | "closing" | null
  >(null);
  const isPartnerStore = storeType === "PARTNER";
  const benefitOptions = benefits.map((benefit) => ({
    label: `${benefit.brand} · ${benefit.name}`,
    value: String(benefit.benefitId),
  }));
  const placeholders = isPartnerStore
    ? {
        address: "예: 서울 송파구 올림픽로 240",
        businessHours: "예: 09:00-18:00",
        consultServices: "입장권 문의, 예약 변경",
        name: "예: 어진월드 어드벤처",
        phone: "예: 02-9876-5432",
        providedServices: "제휴 할인, 현장 결제",
      }
    : {
        address: "예: 서울 강남구 테헤란로 111",
        businessHours: "예: 10:00-20:00",
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
    setValue,
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
  const businessHours = useWatch({ control, name: "businessHours" }) ?? "";
  const [openingTime, closingTime] = businessHours.split("-");
  const canSubmit = isValid && (!isPartnerStore || Boolean(selectedBenefitId));
  const validationMessage = errorMessage;

  const scrollToError = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }, []);

  useEffect(() => {
    if (validationMessage) {
      scrollToError(validationRef.current);
    }
  }, [scrollToError, validationMessage]);

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
        businessHours: values.businessHours?.trim() || null,
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
    const firstErrorName = Object.keys(formErrors)[0];
    const firstErrorElement = firstErrorName
      ? document.querySelector<HTMLElement>(`[name="${firstErrorName}"]`)
      : null;
    if (formErrors.businessHours) {
      setOpenTimePicker(null);
      scrollToError(
        document.querySelector<HTMLElement>("[data-business-hours-anchor]"),
      );
    } else {
      scrollToError(firstErrorElement);
    }
    const coordinateMessage =
      formErrors.lat?.message ?? formErrors.lng?.message;
    const firstMessage = Object.values(formErrors)[0]?.message;

    showToast(
      typeof coordinateMessage === "string"
        ? coordinateMessage
        : typeof firstMessage === "string"
          ? firstMessage
          : `${storeLabel} 정보를 다시 확인해 주세요.`,
    );
  };

  const setBusinessHour = (part: "opening" | "closing", next: string) => {
    const nextOpening = part === "opening" ? next : openingTime;
    const nextClosing = part === "closing" ? next : closingTime;
    setValue(
      "businessHours",
      nextOpening || nextClosing ? `${nextOpening}-${nextClosing}` : "",
      { shouldDirty: true, shouldValidate: true },
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
      description={`저장할 ${storeLabel} 정보를 입력해 주세요.`}
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

      {validationMessage && (
        <p
          ref={validationRef}
          className="mt-5 mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
        >
          {validationMessage}
        </p>
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
          placeholder="예: 37.2660"
          description="-90부터 90 사이의 위도입니다."
          error={errors.lat?.message}
          required
          min={-90}
          max={90}
          step="any"
          type="number"
        />
        <AdminControlledField
          control={control}
          name="lng"
          label="경도"
          inputMode="decimal"
          placeholder="예: 127.0000"
          description="-180부터 180 사이의 경도입니다."
          error={errors.lng?.message}
          required
          min={-180}
          max={180}
          step="any"
          type="number"
        />
        <div data-business-hours-anchor className="sm:col-span-2">
          <span className="mb-2 block text-xs font-extrabold text-gray-500">
            운영시간
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
            <TimePicker
              label="시작 시간"
              value={openingTime ?? ""}
              isOpen={openTimePicker === "opening"}
              onToggle={() =>
                setOpenTimePicker((current) =>
                  current === "opening" ? null : "opening",
                )
              }
              onClose={() => setOpenTimePicker(null)}
              onChange={(next) => setBusinessHour("opening", next)}
            />
            <span className="self-center text-sm font-extrabold text-gray-400 sm:pb-3">
              -
            </span>
            <TimePicker
              label="종료 시간"
              value={closingTime ?? ""}
              isOpen={openTimePicker === "closing"}
              onToggle={() =>
                setOpenTimePicker((current) =>
                  current === "closing" ? null : "closing",
                )
              }
              onClose={() => setOpenTimePicker(null)}
              onChange={(next) => setBusinessHour("closing", next)}
            />
          </div>
          {errors.businessHours ? (
            <p className="mt-2 text-xs leading-5 font-bold text-red-600 dark:text-red-300">
              {errors.businessHours.message}
            </p>
          ) : (
            <p className="mt-2 text-xs leading-5 font-semibold text-gray-400">
              {placeholders.businessHours} 형식으로 입력해 주세요.
            </p>
          )}
        </div>
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
