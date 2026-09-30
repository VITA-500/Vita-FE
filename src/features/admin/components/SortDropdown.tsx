"use client";

import { ArrowDownUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";

type SortDropdownProps = {
  className?: string;
  options?: readonly [string, string];
  onChange?: (value: string) => void;
  value?: string;
};

export const SortDropdown = ({
  className,
  onChange,
  options = ["조회순", "등록순"],
  value,
}: SortDropdownProps) => {
  const [innerValue, setInnerValue] = useState(options[0]);
  const sortLabel = value ?? innerValue;

  const toggleSort = () => {
    const nextLabel = sortLabel === options[0] ? options[1] : options[0];
    setInnerValue(nextLabel);
    onChange?.(nextLabel);
  };

  return (
    <Button
      variant="secondary"
      size="md"
      className={cn(
        "border-border hover:border-brand/40 flex h-12 w-full max-w-[132px] items-center justify-center gap-2 rounded-2xl border bg-white px-4 text-sm font-extrabold text-gray-700 shadow-sm transition hover:text-gray-950 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:text-white",
        className,
      )}
      aria-label={`정렬 기준: ${sortLabel}`}
      onClick={toggleSort}
    >
      <ArrowDownUp size={16} className="text-gray-400" />
      {sortLabel}
    </Button>
  );
};
