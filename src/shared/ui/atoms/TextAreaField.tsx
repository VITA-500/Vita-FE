import type { TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  textareaClassName?: string;
};

/** 설명·오류 문구를 선택적으로 붙일 수 있는 공용 textarea 필드. */
export const TextAreaField = ({
  className,
  description,
  error,
  id,
  label,
  textareaClassName,
  ...props
}: TextAreaFieldProps) => (
  <label className={cn("block", className)} htmlFor={id}>
    {label && (
      <span className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
        {label}
      </span>
    )}
    <textarea
      id={id}
      className={cn(
        "border-border focus:border-brand focus:ring-brand/10 min-h-24 w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-white",
        Boolean(error) &&
          "border-red-400 focus:border-red-500 focus:ring-red-500/10",
        textareaClassName,
      )}
      {...props}
    />
    {error ? (
      <span className="mt-1 block text-xs font-semibold text-red-500">
        {error}
      </span>
    ) : description ? (
      <span className="mt-1 block text-xs font-semibold text-gray-400">
        {description}
      </span>
    ) : null}
  </label>
);
