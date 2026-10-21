import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPaginationItems } from "@/features/store/search/lib/storePanelPagination";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui/atoms/IconButton";

type StorePanelPaginationProps = {
  activePage: number;
  onPageChange: (page: number) => void;
  pageCount: number;
};

/** 매장 목록 페이지 버튼(이전·번호·다음). 페이지가 많으면 "…"로 줄인다. */
export const StorePanelPagination = ({
  activePage,
  onPageChange,
  pageCount,
}: StorePanelPaginationProps) => (
  <nav
    aria-label="매장 목록 페이지"
    className="flex h-11 items-center justify-center gap-1"
  >
    <IconButton
      size="xs"
      onClick={() => onPageChange(activePage - 1)}
      disabled={activePage === 0}
      className="text-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
      aria-label="이전 페이지"
    >
      <ChevronLeft size={15} />
    </IconButton>
    {getPaginationItems(activePage, pageCount).map((page, index) =>
      page === "ellipsis" ? (
        <span
          key={`ellipsis-${index}`}
          aria-hidden="true"
          className="flex h-7 w-5 items-center justify-center text-xs font-extrabold text-gray-400"
        >
          …
        </span>
      ) : (
        <IconButton
          key={page}
          size="xs"
          onClick={() => onPageChange(page)}
          className={cn(
            "min-w-7 rounded-full px-2 text-xs font-extrabold",
            page === activePage
              ? "bg-brand text-white"
              : "text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10",
          )}
          aria-current={page === activePage ? "page" : undefined}
        >
          {page + 1}
        </IconButton>
      ),
    )}
    <IconButton
      size="xs"
      onClick={() => onPageChange(activePage + 1)}
      disabled={activePage === pageCount - 1}
      className="text-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
      aria-label="다음 페이지"
    >
      <ChevronRight size={15} />
    </IconButton>
  </nav>
);
