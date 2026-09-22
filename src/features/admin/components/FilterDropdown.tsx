"use client";

import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";

export type FilterDropdownOption = {
  label: string;
  value: string;
};

type FilterDropdownProps = {
  "aria-label"?: string;
  className?: string;
  onChange: (value: string) => void;
  options: readonly FilterDropdownOption[];
  value: string;
};

// SortDropdown/SearchInput과 나란히 놓였을 때 높이/모양이 맞도록 같은 크기
// 규칙(h-12, rounded-2xl, border-border, shadow-sm)을 그대로 따르고, 열고
// 닫힐 때는 motion으로 부드럽게 스케일·페이드되도록 했어요.
export const FilterDropdown = ({
  "aria-label": ariaLabel,
  className,
  onChange,
  options,
  value,
}: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className="border-border hover:border-brand/40 flex h-12 w-full items-center justify-between gap-2 rounded-2xl border bg-white px-4 text-sm font-extrabold text-gray-700 shadow-sm transition hover:text-gray-950 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:text-white"
      >
        <span className="truncate">{selected?.label ?? "전체"}</span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-gray-400 transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-10"
              aria-label="닫기"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              role="listbox"
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="border-border-soft absolute right-0 z-20 mt-2 w-full min-w-[180px] origin-top-right rounded-2xl border bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="max-h-72 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
                {options.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors duration-200",
                        isSelected
                          ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/10",
                      )}
                    >
                      {option.label}
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
