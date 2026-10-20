import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export type SelectOption = {
  label: string;
  value: string;
};

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  options: readonly SelectOption[];
  placeholder?: string;
};

/**
 * 값이 정해진 목록 중 하나를 고르는 필드에 씁니다(FaqField의 "하위 카테고리" 등).
 * 네이티브 <select>를 기반으로 해서 별도 라이브러리 없이 키보드 탐색과
 * 모바일 피커를 그대로 사용할 수 있어요.
 */
export const Select = ({
  className,
  defaultValue,
  options,
  placeholder,
  ...props
}: SelectProps) => (
  <div className="relative">
    <select
      className={cn(
        "border-border focus:border-brand focus:ring-brand/10 h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-sm font-semibold text-gray-700 transition outline-none focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-gray-100",
        className,
      )}
      defaultValue={defaultValue ?? (placeholder ? "" : undefined)}
      {...props}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    <ChevronDown
      size={16}
      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
    />
  </div>
);
