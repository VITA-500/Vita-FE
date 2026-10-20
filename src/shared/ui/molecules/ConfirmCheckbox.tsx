"use client";

import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type ConfirmCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  children: ReactNode;
  className?: string;
};

// 삭제처럼 되돌릴 수 없는 동작 앞에 두는 "확인했습니다" 체크박스 전용
// 컴포넌트예요. 테이블 행 선택용 기본 체크박스는 브라우저 기본 스타일을
// 그대로 쓰고, 이 컴포넌트는 삭제 관련 확인 문구 쪽에만 적용합니다.
export const ConfirmCheckbox = ({
  children,
  className,
  disabled,
  ...props
}: ConfirmCheckboxProps) => (
  <label
    className={cn(
      "flex items-start gap-2 text-xs leading-5 font-semibold text-gray-500",
      disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      "dark:text-gray-400",
      className,
    )}
  >
    <span
      className={cn(
        "border-border has-[:checked]:border-brand has-[:checked]:bg-brand relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border bg-white transition-colors dark:border-white/20 dark:bg-white/10",
      )}
    >
      <input
        type="checkbox"
        disabled={disabled}
        className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <Check
        size={11}
        strokeWidth={3.5}
        className="pointer-events-none text-white opacity-0 transition-opacity peer-checked:opacity-100"
      />
    </span>
    <span className="min-w-0">{children}</span>
  </label>
);
