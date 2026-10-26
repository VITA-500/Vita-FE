import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

const sizeStyles = {
  sm: "h-9 gap-2 rounded-lg px-3 text-xs",
  md: "h-10 gap-2.5 rounded-xl px-3.5 text-sm",
  lg: "h-12 gap-3 rounded-xl px-4 text-base",
} as const;

export type SearchInputSize = keyof typeof sizeStyles;

export type SearchInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  inputClassName?: string;
  size?: SearchInputSize;
};

export const SearchInput = ({
  className,
  inputClassName,
  placeholder = "검색어를 입력하세요",
  size = "md",
  ...props
}: SearchInputProps) => (
  <label
    className={cn(
      "border-border focus-within:border-brand focus-within:ring-brand/10 flex w-full items-center border bg-white transition focus-within:ring-2 dark:border-white/10 dark:bg-zinc-950",
      sizeStyles[size],
      className,
    )}
  >
    <Search size={16} className="shrink-0 text-gray-400" />
    <input
      className={cn(
        "min-w-0 flex-1 bg-transparent font-medium text-gray-800 outline-none placeholder:font-normal placeholder:text-gray-400 dark:text-gray-100",
        inputClassName,
      )}
      placeholder={placeholder}
      type="search"
      {...props}
    />
  </label>
);
