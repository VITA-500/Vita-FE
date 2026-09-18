import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/Card";

export type AccordionItem = {
  answer: ReactNode;
  question: ReactNode;
};

export type AccordionProps = {
  className?: string;
  defaultOpenIndex?: number;
  items: readonly AccordionItem[];
};

/**
 * 결합할인 상세 조건처럼 항목별로 길어질 수 있는 설명을 접어두고 싶을 때 씁니다.
 * 네이티브 details/summary 기반이라 별도 상태 관리 없이 키보드 접근도 됩니다.
 */
export const Accordion = ({
  className,
  defaultOpenIndex,
  items,
}: AccordionProps) => (
  <Card
    padding="none"
    className={cn(
      "divide-border-soft w-full divide-y overflow-hidden dark:divide-white/10",
      className,
    )}
  >
    {items.map((item, index) => (
      <details
        key={index}
        className="group px-5 py-4"
        open={index === defaultOpenIndex}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-gray-950 marker:content-none dark:text-white [&::-webkit-details-marker]:hidden">
          {item.question}
          <ChevronDown
            size={16}
            className="shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>

        <div className="text-text-secondary mt-3 text-sm leading-6">
          {item.answer}
        </div>
      </details>
    ))}
  </Card>
);
