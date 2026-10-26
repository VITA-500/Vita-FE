"use client";

import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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

// 검색창과 나란히 놓였을 때 높이/모양이 맞도록 같은 크기
// 규칙(h-10, rounded-xl, border-border)을 따르고, 열고
// 닫힐 때는 motion으로 부드럽게 스케일·페이드되도록 했어요.
export const FilterDropdown = ({
  "aria-label": ariaLabel,
  className,
  onChange,
  options,
  value,
}: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  // 바깥을 누르면 닫는다. 예전에는 화면 전체를 덮는 투명 버튼(fixed inset-0)으로 닫았는데,
  // 그 버튼이 휠 스크롤까지 가로채서 모달 안에서 열면 목록만 스크롤되고 모달은 스크롤되지 않았다.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className="border-border hover:border-brand/40 flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-sm font-semibold text-gray-700 transition hover:text-gray-950 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:text-white"
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
          <motion.div
            role="listbox"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="border-border-soft absolute right-0 z-20 mt-2 w-full min-w-[180px] origin-top-right rounded-xl border bg-white p-1 shadow-lg dark:border-white/10 dark:bg-zinc-950"
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
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-medium transition-colors duration-200",
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
        )}
      </AnimatePresence>
    </div>
  );
};
