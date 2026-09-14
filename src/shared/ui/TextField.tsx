import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
};

export const TextField = ({
  className,
  icon,
  label,
  ...props
}: TextFieldProps) => (
  <label className="block">
    <span className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">
      {label}
    </span>

    <span className="border-border focus-within:border-brand focus-within:ring-brand/10 flex h-14 items-center gap-3 rounded-2xl border bg-white px-4 transition focus-within:ring-2 dark:border-white/10 dark:bg-white/5">
      {icon && <span className="shrink-0 text-gray-400">{icon}</span>}

      <input
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:font-medium placeholder:text-gray-400 dark:text-white",
          className,
        )}
        {...props}
      />
    </span>
  </label>
);
