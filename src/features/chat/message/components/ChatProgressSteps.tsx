"use client";

import { useEffect, useState } from "react";
import { Check, RotateCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type {
  ChatAnswerRecovery,
  ChatLocationStatus,
  ChatProgressStage,
} from "@/features/chat/types";
import { cn } from "@/shared/lib/cn";

/**
 * 답변을 기다리는 동안 보여주는 진행 단계.
 *
 * - BE SSE의 assistant_status를 `stage`로 받아 실제 단계를 보여준다.
 *   스트림이 연결되지 않아 `stage`가 없으면 경과 시간으로 단계를 넘긴다. 단계는 뒤로 돌아가지 않는다.
 * - 매장 질문이라 위치를 확인하는 동안(`location`)은 그 단계만 보여주고, 시간 기준 진행도 멈춘다.
 * - 한 단계에 오래 머물면 그 단계의 다음 줄(보조 문구)을 덧붙이고, 앞 줄은 끝난 것으로 남긴다.
 *   (예: 질문을 확인했어요 → 질문 의도를 파악하고 있어요) 실제로 하지 않은 일(재검색 등)은 말하지 않는다.
 * - 스트림이 끊기거나 늦어져 저장된 답변을 다시 불러오면(`recovery`) 그 사실을 마지막 줄로 보여준다.
 */

export type { ChatProgressStage };

type StepLabels = {
  activeLabel: string;
  doneLabel: string;
  /** 오래 머물 때 덧붙이는 다음 줄 */
  longActiveLabel: string;
  longDoneLabel: string;
};

const steps: Array<
  StepLabels & {
    stage: ChatProgressStage;
    /** stage를 주지 않을 때, 답변 요청 후 이 시간(ms)이 지나면 이 단계로 넘어간다. */
    startsAt: number;
  }
> = [
  {
    stage: "understanding",
    activeLabel: "질문을 확인하고 있어요",
    doneLabel: "질문을 확인했어요",
    longActiveLabel: "질문 의도를 파악하고 있어요",
    longDoneLabel: "질문 의도를 파악했어요",
    startsAt: 0,
  },
  {
    // FAQ·요금제 검색에 함께 쓰는 문구
    stage: "retrieving",
    activeLabel: "관련 정보를 찾고 있어요",
    doneLabel: "관련 정보를 찾았어요",
    longActiveLabel: "필요한 정보를 추리고 있어요",
    longDoneLabel: "필요한 정보를 추렸어요",
    startsAt: 900,
  },
  {
    stage: "generating",
    activeLabel: "답변을 정리하고 있어요",
    doneLabel: "답변을 정리했어요",
    longActiveLabel: "답변을 쓰고 있어요",
    longDoneLabel: "답변을 썼어요",
    startsAt: 2600,
  },
];

/** 매장 질문의 검색 단계 문구. 위치를 요청하는 기준(isStoreRelatedPrompt)과 같은 판단을 쓴다. */
const storeRetrievingLabels: StepLabels = {
  activeLabel: "주변 매장 정보를 찾고 있어요",
  doneLabel: "주변 매장 정보를 찾았어요",
  longActiveLabel: "가까운 매장을 추리고 있어요",
  longDoneLabel: "가까운 매장을 추렸어요",
};

const locationLabels = {
  activeLabel: "위치를 확인하고 있어요",
  located: "위치를 확인했어요",
  unavailable: "위치 없이 찾아볼게요",
} as const;

/** 저장된 답변을 다시 불러오는 이유별 문구. FE가 실제로 다시 조회하는 동안만 보여준다. */
export const answerRecoveryLabels: Record<ChatAnswerRecovery, string> = {
  disconnected: "연결이 잠시 끊겨 답변을 다시 불러오고 있어요",
  timeout: "답변이 늦어져 저장된 답변을 다시 확인하고 있어요",
};

/** 한 단계에 이 시간(ms) 넘게 머물면 다음 줄(보조 문구)을 덧붙인다. */
const LONG_STAGE_MS = 4000;
/** 이 시간(ms)이 지나도 답이 없으면 기다려 달라는 안내를 덧붙인다. */
const SLOW_RESPONSE_MS = 15000;

type ChatProgressStepsProps = {
  stage?: ChatProgressStage;
  recovery?: ChatAnswerRecovery;
  location?: ChatLocationStatus;
  isStorePrompt?: boolean;
  className?: string;
};

type Row = {
  key: string;
  label: string;
  isDone: boolean;
  isRecovery?: boolean;
};

export const ChatProgressSteps = ({
  className,
  isStorePrompt = false,
  location,
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

  // 위치 확인이 끝난 시점부터 답변 요청 시간을 잰다(이전 렌더 값을 기억하는 state).
  // 렌더 중 setState는 다음 렌더에 반영되므로, 이번 렌더 계산에는 바뀐 값을 바로 쓴다.
  const [locationMark, setLocationMark] = useState({ status: location, at: 0 });
  const isLocationChanged = locationMark.status !== location;
  if (isLocationChanged) {
    setLocationMark({ status: location, at: elapsedMs });
  }
  const isLocating = location === "locating";
  const locationEndedAt = isLocationChanged ? elapsedMs : locationMark.at;
  const requestStartedAt = location ? locationEndedAt : 0;
  const answerElapsedMs = isLocating ? 0 : elapsedMs - requestStartedAt;

  const timedStepIndex = steps.reduce(
    (current, step, index) =>
      answerElapsedMs >= step.startsAt ? index : current,
    0,
  );
  const stageStepIndex =
    stage === undefined
      ? timedStepIndex
      : steps.findIndex((step) => step.stage === stage);

  // 시간 기준으로 먼저 넘어간 뒤 BE 단계가 늦게 와도 뒤로 돌아가지 않게 한다.
  const [reachedIndex, setReachedIndex] = useState(0);
  if (!isLocating && stageStepIndex > reachedIndex) {
    setReachedIndex(stageStepIndex);
  }
  const currentStepIndex = Math.max(stageStepIndex, reachedIndex);

  const [stageMark, setStageMark] = useState({
    index: currentStepIndex,
    at: 0,
  });
  const isStageChanged = stageMark.index !== currentStepIndex;
  if (isStageChanged) {
    setStageMark({ index: currentStepIndex, at: elapsedMs });
  }
  const stageStartedAt = isStageChanged ? elapsedMs : stageMark.at;
  const inStageMs = elapsedMs - Math.max(stageStartedAt, requestStartedAt);
  const isLongStage = !recovery && !isLocating && inStageMs >= LONG_STAGE_MS;

  // 보조 줄이 한 번 붙은 단계는 다음 단계로 넘어가도 기록으로 남긴다.
  const [longStageIndexes, setLongStageIndexes] = useState<number[]>([]);
  if (isLongStage && !longStageIndexes.includes(currentStepIndex)) {
    setLongStageIndexes([...longStageIndexes, currentStepIndex]);
  }
  const hasLongRow = (index: number) =>
    longStageIndexes.includes(index) ||
    (index === currentStepIndex && isLongStage);
  const isSlow =
    !recovery && !isLocating && answerElapsedMs >= SLOW_RESPONSE_MS;

  const labelsOf = (step: (typeof steps)[number]): StepLabels =>
    step.stage === "retrieving" && isStorePrompt ? storeRetrievingLabels : step;

  const rows: Row[] = [];

  if (location) {
    rows.push({
      key: "location",
      label: isLocating ? locationLabels.activeLabel : locationLabels[location],
      isDone: !isLocating,
    });
  }

  if (!isLocating) {
    steps.slice(0, currentStepIndex + 1).forEach((step, index) => {
      const labels = labelsOf(step);
      // 다시 불러오는 중이면 그 전까지 받은 단계는 끝난 것으로 보여준다.
      const isStepDone = Boolean(recovery) || index < currentStepIndex;
      const withLongRow = hasLongRow(index);

      rows.push({
        key: step.stage,
        label:
          isStepDone || withLongRow ? labels.doneLabel : labels.activeLabel,
        isDone: isStepDone || withLongRow,
      });

      if (withLongRow) {
        rows.push({
          key: `${step.stage}-long`,
          label: isStepDone ? labels.longDoneLabel : labels.longActiveLabel,
          isDone: isStepDone,
        });
      }
    });
  }

  if (recovery) {
    rows.push({
      key: "recovery",
      label: answerRecoveryLabels[recovery],
      isDone: false,
      isRecovery: true,
    });
  }

  const activeRow =
    [...rows].reverse().find((row) => !row.isDone) ?? rows[rows.length - 1];

  return (
    <div className={cn("pt-2", className)}>
      <p role="status" aria-live="polite" className="sr-only">
        {activeRow?.label}
      </p>

      <ol aria-hidden="true" className="space-y-1.5">
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <motion.li
              key={row.key}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {row.isRecovery ? (
                  <RotateCw size={13} className="text-brand animate-spin" />
                ) : row.isDone ? (
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
                  row.isDone
                    ? "text-gray-400 dark:text-gray-500"
                    : "text-text-primary font-semibold dark:text-white",
                )}
              >
                {row.label}
                {!row.isDone && (
                  <span className="ml-0.5 inline-flex w-4 animate-pulse">
                    …
                  </span>
                )}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      {isSlow && (
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
