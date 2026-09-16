"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

export type GuidedStepFlowStep = {
  title: ReactNode;
  description?: ReactNode;
  /**
   * 이 단계가 진행 중일 때만 보여줄 콘텐츠(주로 입력 폼)입니다.
   * onNext를 호출하면 다음 단계로 넘어갑니다. 생략하면 "확인" 버튼이 대신 나와요.
   */
  content?: (helpers: { onNext: () => void }) => ReactNode;
  /** content 없이 자동으로 나오는 진행 버튼의 문구 (기본: "확인") */
  nextLabel?: ReactNode;
};

export type GuidedStepFlowProps = {
  className?: string;
  completedMessage?: ReactNode;
  description?: ReactNode;
  onComplete?: () => void;
  steps: readonly GuidedStepFlowStep[];
  title?: ReactNode;
};

/**
 * 챗봇 답변 안에서 "다음 단계로 넘어가려면 사용자 입력이 필요한" 절차를 보여줄 때 씁니다.
 * 정적인 절차 안내만 필요하면 StepGuideCard를, 단계마다 폼을 받아 진행해야 하면
 * 이 컴포넌트를 씁니다. 지나간 단계는 완료 표시되고, 다가올 단계는 흐리게 접혀 있어요.
 */
export const GuidedStepFlow = ({
  className,
  completedMessage = "모든 단계를 완료했어요.",
  description,
  onComplete,
  steps,
  title,
}: GuidedStepFlowProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const isComplete = activeIndex >= steps.length;

  const goNext = () => {
    setActiveIndex((current) => {
      const next = current + 1;
      if (next >= steps.length) {
        onComplete?.();
      }
      return next;
    });
  };

  return (
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
        {steps.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <li key={index} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors",
                    isDone
                      ? "bg-brand-soft text-brand dark:bg-brand/15"
                      : isActive
                        ? "bg-brand text-white"
                        : "bg-surface-muted text-gray-400 dark:bg-white/10",
                  )}
                >
                  {isDone ? <Check size={13} strokeWidth={3} /> : index + 1}
                </span>
                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1 w-px flex-1 border-l",
                      isDone
                        ? "border-brand/40"
                        : "border-border-soft dark:border-white/10",
                    )}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <p
                  className={cn(
                    "text-sm font-bold transition-colors",
                    isDone || isActive
                      ? "text-text-primary"
                      : "text-gray-400 dark:text-gray-600",
                  )}
                >
                  {step.title}
                </p>

                {step.description && (isDone || isActive) && (
                  <p className="text-text-secondary mt-1 text-xs leading-5">
                    {step.description}
                  </p>
                )}

                {isActive && (
                  <div className="mt-3">
                    {step.content ? (
                      step.content({ onNext: goNext })
                    ) : (
                      <Button size="sm" onClick={goNext}>
                        {step.nextLabel ?? "확인"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {isComplete && (
        <p className="text-brand border-border-soft mt-4 border-t pt-4 text-sm font-bold dark:border-white/10">
          {completedMessage}
        </p>
      )}
    </Card>
  );
};
