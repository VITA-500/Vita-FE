import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/Card";

export type StepGuideStep = {
  title: ReactNode;
  description?: ReactNode;
};

export type StepGuideCardProps = {
  className?: string;
  description?: ReactNode;
  steps: readonly StepGuideStep[];
  title?: ReactNode;
};

/**
 * 유심 재발급, 번호이동처럼 "순서대로 처리해야 하는 절차"를 안내할 때 씁니다.
 * 요금제 비교처럼 나열형 정보에는 PlanCard를, 절차 안내에는 이 컴포넌트를 씁니다.
 */
export const StepGuideCard = ({
  className,
  description,
  steps,
  title,
}: StepGuideCardProps) => (
  <Card padding="md" className={cn("w-full", className)}>
    {(title || description) && (
      <div className="mb-4">
        {title && (
          <p className="text-sm font-extrabold text-gray-950 dark:text-white">
            {title}
          </p>
        )}
        {description && (
          <p className="text-text-secondary mt-1 text-xs leading-5">
            {description}
          </p>
        )}
      </div>
    )}

    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="bg-brand flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white">
              {index + 1}
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className="border-border-soft mt-1 w-px flex-1 border-l dark:border-white/10"
              />
            )}
          </div>

          <div className="min-w-0 pb-1">
            <p className="text-text-primary text-sm font-bold">{step.title}</p>
            {step.description && (
              <p className="text-text-secondary mt-1 text-xs leading-5">
                {step.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  </Card>
);
