"use client";

import { useEffect, useState } from "react";
import { Check, RotateCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type {
  ChatAnswerRecovery,
  ChatProgressStage,
} from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";

/**
 * 답변을 기다리는 동안 보여주는 진행 단계.
 *
 * BE SSE의 assistant_status를 `stage`로 받아 실제 단계를 보여준다.
 * 스트림이 연결되지 않아 `stage`가 없으면 경과 시간으로 단계를 넘긴다.
 * 스트림이 끊기거나 늦어져 저장된 답변을 다시 불러오면(`recovery`) 그 사실을 마지막 줄로 보여준다.
 */

export type { ChatProgressStage };

const steps: Array<{
  stage: ChatProgressStage;
  activeLabel: string;
  doneLabel: string;
  /** stage를 주지 않을 때, 로딩 시작 후 이 시간(ms)이 지나면 이 단계로 넘어간다. */
  startsAt: number;
}> = [
  {
    stage: "understanding",
    activeLabel: "질문을 확인하고 있어요",
    doneLabel: "질문을 확인했어요",
    startsAt: 0,
  },
  {
    stage: "retrieving",
    activeLabel: "관련 FAQ를 찾고 있어요",
    doneLabel: "관련 FAQ를 찾았어요",
    startsAt: 900,
  },
  {
    stage: "generating",
    activeLabel: "답변을 정리하고 있어요",
    doneLabel: "답변을 정리했어요",
    startsAt: 2600,
  },
];

/** 저장된 답변을 다시 불러오는 이유별 문구. FE가 실제로 다시 조회하는 동안만 보여준다. */
export const answerRecoveryLabels: Record<ChatAnswerRecovery, string> = {
  disconnected: "연결이 잠시 끊겨 답변을 다시 불러오고 있어요",
  timeout: "답변이 늦어져 저장된 답변을 다시 확인하고 있어요",
};

/** 이 시간(ms)이 지나도 답이 없으면 기다려 달라는 안내를 덧붙인다. */
const SLOW_RESPONSE_MS = 15000;

type ChatProgressStepsProps = {
  stage?: ChatProgressStage;
  recovery?: ChatAnswerRecovery;
  className?: string;
};

export const ChatProgressSteps = ({
  className,
  recovery,
  stage,
}: ChatProgressStepsProps) => {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 300);

    return () => window.clearInterval(intervalId);
  }, []);

  const timedStepIndex = steps.reduce(
    (current, step, index) => (elapsedMs >= step.startsAt ? index : current),
    0,
  );
  const currentStepIndex =
    stage === undefined
      ? timedStepIndex
      : steps.findIndex((step) => step.stage === stage);
  const visibleSteps = steps.slice(0, currentStepIndex + 1);
  const currentStep = steps[currentStepIndex];
  const isSlow = elapsedMs >= SLOW_RESPONSE_MS;
  const recoveryLabel = recovery ? answerRecoveryLabels[recovery] : null;

  return (
    <div className={cn("pt-2", className)}>
      <p role="status" aria-live="polite" className="sr-only">
        {recoveryLabel ?? currentStep.activeLabel}
      </p>

      <ol aria-hidden="true" className="space-y-1.5">
        <AnimatePresence initial={false}>
          {visibleSteps.map((step, index) => {
            // 다시 불러오는 중이면 그 전까지 받은 단계는 끝난 것으로 보여준다.
            const isDone = Boolean(recoveryLabel) || index < currentStepIndex;

            return (
              <motion.li
                key={step.stage}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 text-sm"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {isDone ? (
                    <span className="bg-brand-soft text-brand-hover dark:bg-brand/15 dark:text-brand flex h-4.5 w-4.5 items-center justify-center rounded-full">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="bg-brand/60 absolute inline-flex h-full w-full animate-ping rounded-full" />
                      <span className="bg-brand relative inline-flex h-2.5 w-2.5 rounded-full" />
                    </span>
                  )}
                </span>

                <span
                  className={cn(
                    "transition-colors duration-300",
                    isDone
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-text-primary font-semibold dark:text-white",
                  )}
                >
                  {isDone ? step.doneLabel : step.activeLabel}
                  {!isDone && (
                    <span className="ml-0.5 inline-flex w-4 animate-pulse">
                      …
                    </span>
                  )}
                </span>
              </motion.li>
            );
          })}
          {recoveryLabel && (
            <motion.li
              key="recovery"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                <RotateCw size={13} className="text-brand animate-spin" />
              </span>
              <span className="text-text-primary font-semibold dark:text-white">
                {recoveryLabel}
                <span className="ml-0.5 inline-flex w-4 animate-pulse">…</span>
              </span>
            </motion.li>
          )}
        </AnimatePresence>
      </ol>

      {isSlow && !recoveryLabel && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 pl-7 text-xs text-gray-400 dark:text-gray-500"
        >
          답변이 조금 길어지고 있어요. 잠시만 기다려 주세요.
        </motion.p>
      )}
    </div>
  );
};
