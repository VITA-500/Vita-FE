"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Modal } from "@/shared/ui/organisms/Modal";
import { Button } from "@/shared/ui/atoms/Button";
import { AdminField } from "@/features/admin/common/components/AdminField";
import type { SelectOption } from "@/shared/ui/atoms/Select";
import type { AdminPlan, AdminPlanRequest } from "@/entities/plan";
import {
  planDataPolicies,
  planNetworkTypes,
  planTargetGroups,
  planUsagePolicies,
} from "@/entities/plan";
const blank: AdminPlanRequest = {
  planCode: "",
  name: "",
  summary: "",
  price: 0,
  networkType: "5G",
  targetGroup: "GENERAL",
  minAge: null,
  maxAge: null,
  dataPolicy: "UNLIMITED",
  baseDataMb: null,
  exhaustedSpeedKbps: null,
  voicePolicy: "UNLIMITED",
  voiceMinutes: null,
  smsPolicy: "UNLIMITED",
  smsCount: null,
  description: "",
};

const targetAgeRanges = {
  KIDS: { label: "키즈", min: 0, max: 13 },
  TEEN: { label: "청소년", min: 14, max: 18 },
  YOUTH: { label: "청년", min: 19, max: 34 },
  SENIOR: { label: "시니어", min: 65, max: 150 },
} as const;

const getAgeValidationMessage = (plan: AdminPlanRequest) => {
  if (
    plan.minAge !== null &&
    plan.maxAge !== null &&
    plan.minAge > plan.maxAge
  ) {
    return "최소 연령은 최대 연령보다 클 수 없습니다.";
  }
  const range =
    targetAgeRanges[plan.targetGroup as keyof typeof targetAgeRanges];
  if (
    range &&
    ((plan.minAge !== null && plan.minAge < range.min) ||
      (plan.maxAge !== null && plan.maxAge > range.max))
  ) {
    return `${range.label} 대상은 만 ${range.min}~${range.max}세 범위로 입력해 주세요.`;
  }
  return null;
};
export const PlanFormModal = ({
  isOpen,
  mode,
  initialValues,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  mode: "create" | "edit";
  initialValues?: AdminPlan;
  onClose: () => void;
  onSave: (
    input: AdminPlanRequest | Partial<AdminPlanRequest>,
  ) => Promise<void>;
}) => {
  const [value, setValue] = useState<AdminPlanRequest>(() => {
    if (!initialValues) return blank;
    const { planId, status, createdAt, updatedAt, ...form } = initialValues;
    void planId;
    void status;
    void createdAt;
    void updatedAt;
    return form;
  });
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validationRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (validationMessage) {
      window.requestAnimationFrame(() => {
        validationRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [validationMessage]);
  const closeModal = () => {
    if (isSubmitting) return;
    setValidationMessage(null);
    onClose();
  };
  const showValidation = (message: string) => {
    setValidationMessage(message);
    window.requestAnimationFrame(() => {
      validationRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  const set = (key: keyof AdminPlanRequest, next: string) => {
    const nextValue = {
      ...value,
      [key]: [
        "price",
        "minAge",
        "maxAge",
        "baseDataMb",
        "exhaustedSpeedKbps",
        "voiceMinutes",
        "smsCount",
      ].includes(key)
        ? next === ""
          ? null
          : Number(next)
        : next,
    } as AdminPlanRequest;
    setValue(nextValue);
    if (["targetGroup", "minAge", "maxAge"].includes(key)) {
      const ageMessage = getAgeValidationMessage(nextValue);
      setValidationMessage(ageMessage);
    }
  };
  const setPolicy = (
    key: "dataPolicy" | "voicePolicy" | "smsPolicy",
    next: string,
  ) =>
    setValue((old) => ({
      ...old,
      [key]: next,
      ...(key === "dataPolicy" && next === "UNLIMITED"
        ? { baseDataMb: null, exhaustedSpeedKbps: null }
        : {}),
      ...(key === "voicePolicy" && next !== "LIMITED"
        ? { voiceMinutes: null }
        : {}),
      ...(key === "smsPolicy" && next !== "LIMITED" ? { smsCount: null } : {}),
    }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setValidationMessage(null);
    if (
      !value.planCode.trim() ||
      !value.name.trim() ||
      !value.summary.trim() ||
      !value.description.trim()
    ) {
      showValidation("필수 항목을 모두 입력해 주세요.");
      return;
    }
    const ageMessage = getAgeValidationMessage(value);
    if (ageMessage) {
      setValidationMessage(ageMessage);
      window.requestAnimationFrame(() => {
        validationRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      return;
    }
    if (
      value.dataPolicy === "LIMITED" &&
      (!value.baseDataMb || value.baseDataMb < 1)
    ) {
      showValidation("데이터 제공량 제한을 입력해 주세요.");
      return;
    }
    if (
      value.dataPolicy === "UNLIMITED" &&
      (value.baseDataMb !== null || value.exhaustedSpeedKbps !== null)
    ) {
      showValidation(
        "무제한 데이터 정책에서는 데이터 제한 값을 입력할 수 없습니다.",
      );
      return;
    }
    if (
      value.voicePolicy === "LIMITED" &&
      (!value.voiceMinutes || value.voiceMinutes < 1)
    ) {
      showValidation("통화 제공량은 1분 이상 입력해 주세요.");
      return;
    }
    if (value.voicePolicy !== "LIMITED" && value.voiceMinutes !== null) {
      showValidation("통화 제공량은 제한 정책에서만 입력할 수 있습니다.");
      return;
    }
    if (
      value.smsPolicy === "LIMITED" &&
      (!value.smsCount || value.smsCount < 1)
    ) {
      showValidation("문자 제공량은 1건 이상 입력해 주세요.");
      return;
    }
    if (value.smsPolicy !== "LIMITED" && value.smsCount !== null) {
      showValidation("문자 제공량은 제한 정책에서만 입력할 수 있습니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(mode === "edit" ? value : value);
    } finally {
      setIsSubmitting(false);
    }
  };
  const field = (
    key: keyof AdminPlanRequest,
    label: string,
    type = "text",
    className?: string,
  ) => (
    <AdminField
      className={className}
      label={label}
      type={type}
      placeholder={
        (
          {
            planCode: "예: BASIC_5G_001",
            name: "예: 5G 베이직 요금제",
            summary: "예: 부담 없이 시작하는 5G 요금제",
            price: "예: 55000",
            baseDataMb: "예: 10000",
            exhaustedSpeedKbps: "예: 1000",
            voiceMinutes: "예: 300",
            smsCount: "예: 100",
            minAge: "예: 0",
            maxAge: "예: 150",
          } as Record<string, string>
        )[key]
      }
      value={value[key] ?? ""}
      min={type === "number" ? 0 : undefined}
      onChange={(event) => {
        if (type === "number" && event.target.value.includes("-")) {
          setValidationMessage("음수는 입력할 수 없습니다.");
          return;
        }
        setValidationMessage(null);
        set(key, event.target.value);
      }}
      onKeyDown={(event) => {
        if (type === "number" && event.key === "-") {
          event.preventDefault();
          setValidationMessage("음수는 입력할 수 없습니다.");
        }
      }}
      required={["planCode", "name", "summary", "price"].includes(key)}
    />
  );
  const options = (
    values: readonly string[],
    labels: Record<string, string>,
  ): readonly SelectOption[] =>
    values.map((option) => ({
      label: labels[option] ?? option,
      value: option,
    }));
  const networkOptions = options(planNetworkTypes, {
    LTE: "LTE",
    "5G": "5G",
    LTE_5G: "LTE + 5G",
  });
  const targetOptions = options(planTargetGroups, {
    GENERAL: "일반",
    TEEN: "청소년",
    YOUTH: "청년",
    SENIOR: "시니어",
    KIDS: "키즈",
    TABLET: "태블릿",
    WATCH: "워치",
  });
  const policyOptions = options(planDataPolicies, {
    LIMITED: "제공량 제한",
    UNLIMITED: "무제한",
  });
  const usageOptions = options(planUsagePolicies, {
    NONE: "제공 없음",
    LIMITED: "제공량 제한",
    UNLIMITED: "무제한",
  });
  const selectField = (
    key: keyof AdminPlanRequest,
    label: string,
    fieldOptions: readonly SelectOption[],
    onChange = (next: string) => set(key, next),
  ) => (
    <AdminField
      label={label}
      options={fieldOptions}
      value={String(value[key] ?? "")}
      onChange={(event) => onChange(event.target.value)}
      required
    />
  );
  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={mode === "create" ? "요금제 등록" : "요금제 수정"}
      description="설명 변경 시 BE가 검색 임베딩을 갱신합니다."
      size="lg"
      className="max-h-[calc(100dvh-3rem)] overflow-y-auto"
      actions={
        <>
          <Button variant="ghost" onClick={closeModal} disabled={isSubmitting}>
            취소
          </Button>
          <Button form="plan-form" type="submit" isLoading={isSubmitting}>
            {mode === "create" ? "등록" : "저장"}
          </Button>
        </>
      }
    >
      {validationMessage && (
        <p
          ref={validationRef}
          className="mt-5 mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
        >
          {validationMessage}
        </p>
      )}
      <form
        id="plan-form"
        onSubmit={submit}
        className="grid gap-4 sm:grid-cols-2"
      >
        {field("planCode", "요금제 코드")}
        {field("name", "요금제 이름")}
        {field("summary", "요약")}
        {field("price", "월 요금", "number")}
        {selectField("networkType", "네트워크", networkOptions)}
        {selectField("targetGroup", "대상 그룹", targetOptions)}
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
          {selectField("dataPolicy", "데이터 정책", policyOptions, (next) =>
            setPolicy("dataPolicy", next),
          )}
          {value.dataPolicy === "LIMITED" &&
            field("baseDataMb", "기본 데이터(MB)", "number")}
          {value.dataPolicy === "LIMITED" &&
            field("exhaustedSpeedKbps", "소진 후 속도(Kbps)", "number")}
        </div>
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          {selectField("voicePolicy", "음성 정책", usageOptions, (next) =>
            setPolicy("voicePolicy", next),
          )}
          {value.voicePolicy === "LIMITED" &&
            field("voiceMinutes", "통화 제공량(분)", "number")}
        </div>
        <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          {selectField("smsPolicy", "문자 정책", usageOptions, (next) =>
            setPolicy("smsPolicy", next),
          )}
          {value.smsPolicy === "LIMITED" &&
            field("smsCount", "문자 제공량", "number")}
        </div>
        {field("minAge", "최소 연령", "number")}
        {field("maxAge", "최대 연령", "number")}
        <AdminField
          className="sm:col-span-2"
          label="설명"
          multiline
          placeholder="예: 월 10GB 데이터와 기본 음성·문자를 제공하는 5G 요금제입니다."
          value={value.description}
          onChange={(event) => set("description", event.target.value)}
          required
        />
      </form>
    </Modal>
  );
};
