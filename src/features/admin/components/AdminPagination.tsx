"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type FormEvent, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";

type AdminPaginationProps = {
  currentPage: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  totalPages: number;
};

type PaginationItem = number | "ellipsis";

export const AdminPagination = ({
  currentPage,
  disabled = false,
  onPageChange,
  totalPages,
}: AdminPaginationProps) => {
  const pages = getVisiblePages(currentPage, totalPages);
  const [jumpValue, setJumpValue] = useState("");

  const handleJumpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPage = Number(jumpValue);

    if (!Number.isInteger(nextPage)) return;

    onPageChange(Math.min(totalPages, Math.max(1, nextPage)));
    setJumpValue("");
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pt-2 md:pt-0">
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="xs"
          className="h-8 w-8 rounded-lg p-0 disabled:pointer-events-none disabled:opacity-30"
          disabled={currentPage === 1 || disabled}
          aria-label="이전 페이지"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft size={15} />
        </Button>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 min-w-8 items-center justify-center px-1 text-sm font-extrabold text-gray-400"
            >
              ...
            </span>
          ) : (
            <PaginationPageButton
              key={page}
              disabled={disabled}
              isActive={page === currentPage}
              page={page}
              onClick={() => onPageChange(page)}
            />
          ),
        )}

        <Button
          variant="ghost"
          size="xs"
          className="h-8 w-8 rounded-lg p-0 disabled:pointer-events-none disabled:opacity-30"
          disabled={currentPage === totalPages || disabled}
          aria-label="다음 페이지"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <ChevronRight size={15} />
        </Button>
      </div>

      {totalPages > 7 && (
        <form className="flex items-center gap-1.5" onSubmit={handleJumpSubmit}>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            disabled={disabled}
            placeholder="페이지"
            onChange={(event) => setJumpValue(event.target.value)}
            className="border-border focus:border-brand h-8 w-20 rounded-lg border bg-white px-2 text-center text-xs font-bold text-gray-700 transition outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
          />
          <Button
            variant="secondary"
            size="xs"
            type="submit"
            disabled={disabled || !jumpValue}
            className="h-8 rounded-lg px-2"
          >
            이동
          </Button>
        </form>
      )}
    </div>
  );
};

const getVisiblePages = (
  currentPage: number,
  totalPages: number,
): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  const pages: PaginationItem[] = [1];

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
};

type PaginationPageButtonProps = {
  disabled?: boolean;
  isActive: boolean;
  onClick: () => void;
  page: number;
};

const PaginationPageButton = ({
  disabled,
  isActive,
  onClick,
  page,
}: PaginationPageButtonProps) => (
  <button
    type="button"
    aria-label={`${page}페이지`}
    aria-current={isActive ? "page" : undefined}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-extrabold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
      isActive
        ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white",
    )}
  >
    {page}
  </button>
);
