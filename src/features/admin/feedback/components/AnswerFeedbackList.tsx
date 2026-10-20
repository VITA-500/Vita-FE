"use client";

import { ChevronDown, MessageSquareWarning } from "lucide-react";
import { useState } from "react";
import { AdminEmptyState } from "@/features/admin/common/components/AdminEmptyState";
import type { AnswerFeedbackListItem } from "@/features/admin/feedback/lib/answerFeedbackFilters";
import { cn } from "@/shared/lib/cn";
import { formatKoreanMonthDay } from "@/shared/lib/date";
import { Button } from "@/shared/ui/atoms/Button";
import { Modal } from "@/shared/ui/organisms/Modal";
import { useAdminTrace } from "@/features/admin/feedback/hooks/useAdminTrace";
import type {
  AdminAnswerFeedback,
  AdminAnswerFeedbackReason,
} from "@/entities/feedback";

const failReasonLabels: Record<AdminAnswerFeedbackReason, string> = {
  ANSWER_FAILED: "답변 실패",
  LOW_SIMILARITY: "유사도 낮음",
  NO_MATCH: "검색 결과 없음",
  DISLIKED: "아쉬워요",
};

const getFailReasonLabel = (reason: string) =>
  failReasonLabels[reason as AdminAnswerFeedbackReason] ?? reason;

/** 피드백 유형별 배지 색. 사용자가 직접 남긴 아쉬워요와 자동 감지 사유를 눈으로 구분하게 한다. */
const failReasonStyles: Record<AdminAnswerFeedbackReason, string> = {
  DISLIKED: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  NO_MATCH:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  LOW_SIMILARITY: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  ANSWER_FAILED:
    "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
};

const getFailReasonStyle = (reason: string) =>
  failReasonStyles[reason as AdminAnswerFeedbackReason] ??
  failReasonStyles.ANSWER_FAILED;

const isInfrastructureErrorAnswer = (answer: string) =>
  /BedrockRuntime|unable to process your request|Status Code:\s*5\d\d|Request ID:/i.test(
    answer,
  );

const traceSpanLabels: Record<string, string> = {
  transform: "질문 변환",
  faq_retrieve: "FAQ 검색",
  plan_retrieve: "요금제 검색",
  plan_lookup: "요금제 상세 조회",
  store_lookup: "매장 조회",
  generation: "답변 생성",
};

const traceFlagLabels: Record<string, string> = {
  SEARCH_FAILURE_SUSPECTED: "검색 실패 의심",
  SLOW: "처리 지연",
  TRANSFORM_FAILED: "질문 변환 실패",
  RULE_BLOCKED: "규칙에 의해 검색 차단",
  SKIPPED: "단계 건너뜀",
  ERROR: "오류",
};

const traceFlagStyles: Record<string, string> = {
  ERROR: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  TRANSFORM_FAILED:
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  SEARCH_FAILURE_SUSPECTED:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  RULE_BLOCKED:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  SLOW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
  SKIPPED: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
};

/** 머리글과 각 행이 같은 칸 너비를 쓰도록 맞춘다(md 이상에서만 표 형태). */
const rowGridClassName =
  "md:grid md:grid-cols-[minmax(0,1fr)_64px_104px_64px_64px] md:gap-4";

export type DismissFeedback = (
  id: number,
  options?: { onSettled?: () => void },
) => void;

type AnswerFeedbackListProps = {
  candidates: readonly AnswerFeedbackListItem[];
  /** 무시 처리 중인 항목 id */
  dismissingId?: number;
  /** 무시. 없으면 무시 버튼을 비활성으로 둔다. */
  onDismiss?: DismissFeedback;
  /** 항목이 없을 때 문구(필터 탭마다 다르게 쓴다) */
  emptyTitle?: string;
  emptyDescription?: string;
};

/** 챗봇 답변 피드백 목록. 대시보드와 답변 피드백 페이지가 함께 쓴다. */
export const AnswerFeedbackList = ({
  candidates,
  dismissingId,
  onDismiss,
  emptyTitle = "확인할 답변 피드백이 없어요.",
  emptyDescription = "챗봇이 답하지 못했거나 사용자가 아쉬워요를 누른 답변이 생기면 여기에 모여요.",
}: AnswerFeedbackListProps) => {
  const [dismissTarget, setDismissTarget] = useState<AdminAnswerFeedback>();
  const isDismissingTarget =
    dismissTarget !== undefined && dismissingId === dismissTarget.id;

  const closeDismissModal = () => {
    if (isDismissingTarget) return;
    setDismissTarget(undefined);
  };

  const confirmDismiss = () => {
    if (!dismissTarget || !onDismiss) return;
    onDismiss(dismissTarget.id, {
      onSettled: () => setDismissTarget(undefined),
    });
  };

  if (candidates.length === 0) {
    return (
      <AdminEmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <>
      <div
        className={cn(
          rowGridClassName,
          "hidden px-4 pb-2 text-xs font-bold text-gray-400 md:grid",
        )}
      >
        <span className="text-center">질문</span>
        <span>횟수</span>
        <span>피드백 유형</span>
        <span>발생 일자</span>
        <span className="text-center">{onDismiss ? "관리" : ""}</span>
      </div>
      <div className="space-y-3">
        {candidates.map((candidate) => (
          <FeedbackRow
            key={`${candidate.id}-${candidate.question}`}
            candidate={candidate}
            isDismissing={dismissingId === candidate.id}
            onRequestDismiss={onDismiss ? setDismissTarget : undefined}
          />
        ))}
      </div>

      <Modal
        isOpen={dismissTarget !== undefined}
        onClose={closeDismissModal}
        size="sm"
        title="이 피드백을 무시할까요?"
        description="같은 질문으로 들어온 피드백(자동 감지·아쉬워요)이 모두 목록에서 내려가고, 되돌릴 수 없어요."
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeDismissModal}
              disabled={isDismissingTarget}
            >
              취소
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDismissingTarget}
              onClick={confirmDismiss}
            >
              무시
            </Button>
          </>
        }
      >
        {dismissTarget && (
          <div className="space-y-3">
            <p className="bg-surface-muted line-clamp-3 rounded-2xl px-4 py-3 text-sm font-bold break-words whitespace-pre-line text-gray-700 dark:bg-white/5 dark:text-gray-200">
              {dismissTarget.question}
            </p>
            <p className="text-text-secondary text-xs leading-5 font-semibold">
              같은 질문이 나중에 다시 해결되지 않으면 새 항목으로 다시 올라와요.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

const FeedbackRow = ({
  candidate,
  isDismissing,
  onRequestDismiss,
}: {
  candidate: AnswerFeedbackListItem;
  isDismissing: boolean;
  onRequestDismiss?: (candidate: AdminAnswerFeedback) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const trace = useAdminTrace(candidate.id, isExpanded);
  // 2026-10-18 BE부터 자동 감지만 있는 항목도 무시할 수 있다.
  const canDismiss = Boolean(onRequestDismiss);
  const answer = candidate.answer?.trim();
  const visibleAnswer =
    answer && !isInfrastructureErrorAnswer(answer) ? answer : null;
  const comments = candidate.comments ?? [];
  // 사유 탭에서는 그 탭에 걸린 사유를 배지로 쓰고, 가장 최근 사유가 다르면 따로 적는다.
  const badgeReasons: readonly string[] = candidate.matchedReasons?.length
    ? candidate.matchedReasons
    : [candidate.failReason];
  const isLatestReasonDifferent = !badgeReasons.includes(candidate.failReason);

  return (
    <div
      className={cn(
        rowGridClassName,
        "border-border-soft grid gap-3 rounded-2xl border px-4 py-3 md:items-center dark:border-white/10",
      )}
    >
      <div className="min-w-0">
        {/* 화살표는 질문 칸 오른쪽 끝에 고정해 질문 길이와 상관없이 행마다 같은 위치에 둔다. */}
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 text-sm leading-6 font-extrabold break-words whitespace-pre-line text-gray-800 dark:text-gray-100",
              !isExpanded && "line-clamp-2",
            )}
          >
            {candidate.question}
          </p>
          <button
            type="button"
            className="hover:bg-surface-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-400 transition outline-none hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "답변 접기" : "답변 펼치기"}
            onClick={() => setIsExpanded((value) => !value)}
          >
            <ChevronDown
              size={16}
              className={cn("transition-transform", isExpanded && "rotate-180")}
            />
          </button>
        </div>
        {comments.length > 0 && (
          <p className="mt-1 text-[11px] font-bold text-rose-500 dark:text-rose-300">
            아쉬운 이유 {comments.length}개
          </p>
        )}
      </div>

      {/* 모바일에서는 한 줄로 흐르고, md 이상에서는 각 항목이 표 칸에 들어간다. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:contents">
        <div className="text-brand flex h-6 items-center gap-1">
          <MessageSquareWarning size={16} />
          <span className="text-base font-black">
            {candidate.count.toLocaleString("ko-KR")}
          </span>
          <span className="text-xs font-bold text-gray-400">회</span>
        </div>

        <div className="flex flex-wrap items-center gap-1 md:flex-col md:items-start">
          {badgeReasons.map((reason) => (
            <span
              key={reason}
              className={cn(
                "flex h-6 w-fit items-center rounded-full px-2.5 text-xs font-extrabold whitespace-nowrap",
                getFailReasonStyle(reason),
              )}
            >
              {getFailReasonLabel(reason)}
            </span>
          ))}
          {isLatestReasonDifferent && (
            <span className="text-[11px] font-bold whitespace-nowrap text-gray-400">
              최근: {getFailReasonLabel(candidate.failReason)}
            </span>
          )}
        </div>

        <span className="flex h-6 items-center text-xs font-bold whitespace-nowrap text-gray-400">
          {formatKoreanMonthDay(candidate.lastOccurredAt)}
        </span>

        <div className="ml-auto flex md:-mt-1 md:ml-0 md:justify-center">
          <div className="flex items-center gap-1">
            {canDismiss ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                isLoading={isDismissing}
                onClick={() => onRequestDismiss?.(candidate)}
              >
                무시
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 답변은 행 전체 너비로 펼쳐 오른쪽이 비지 않게 한다. */}
      {isExpanded && (
        <div className="bg-surface-muted flex items-start gap-2 rounded-xl px-3 py-2.5 md:col-span-full dark:bg-white/5">
          <span className="bg-brand-soft text-brand dark:bg-brand/15 shrink-0 rounded-full px-2 py-0.5 text-[11px] leading-4 font-extrabold">
            답변
          </span>
          <p className="max-h-48 min-w-0 flex-1 overflow-y-auto text-xs leading-5 font-medium break-words whitespace-pre-line text-gray-600 dark:text-gray-300">
            {visibleAnswer ||
              (candidate.failReason === "ANSWER_FAILED"
                ? "답변 생성에 실패했어요. 처리 단계의 오류 상태를 확인해 주세요."
                : "저장된 답변이 없어요.")}
          </p>
        </div>
      )}
      {isExpanded && comments.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-50/60 px-3 py-2.5 md:col-span-full dark:bg-rose-500/10">
          <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] leading-4 font-extrabold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
            이유
          </span>
          <ul className="min-w-0 flex-1 space-y-1 text-xs leading-5 font-medium break-words text-gray-600 dark:text-gray-300">
            {comments.map((comment, index) => (
              <li key={`${index}-${comment}`}>{comment}</li>
            ))}
          </ul>
        </div>
      )}
      {isExpanded && <FeedbackTraceInline trace={trace} />}
    </div>
  );
};

const traceValue = (value: unknown) =>
  typeof value === "string"
    ? value
    : value
      ? JSON.stringify(value, null, 2)
      : "";

const traceErrorMessage = (error: unknown) => {
  const record = recordOf(error);
  const message =
    typeof record?.message === "string" ? record.message : traceValue(error);
  return isInfrastructureErrorAnswer(message)
    ? "답변 생성 서버에서 오류가 발생했어요."
    : message;
};

const recordOf = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const numberOf = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const FeedbackTraceInline = ({
  trace,
}: {
  trace: ReturnType<typeof useAdminTrace>;
}) => {
  if (trace.isLoading) {
    return (
      <p className="bg-surface-muted mt-3 rounded-xl px-3 py-2 text-xs font-semibold">
        처리 과정을 불러오고 있어요.
      </p>
    );
  }
  if (trace.error) {
    return (
      <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
        {trace.error}
      </p>
    );
  }
  if (!trace.trace) {
    return (
      <p className="bg-surface-muted mt-3 rounded-xl px-3 py-2 text-xs font-semibold">
        처리 과정 기록이 없어요.
      </p>
    );
  }

  const generation = trace.trace.spans.find(
    (span) => span.type === "generation",
  );
  const retrieval = trace.trace.spans.find(
    (span) => span.type === "faq_retrieve",
  );
  const generationHistory = recordOf(generation?.history);
  const retrievalHistory = recordOf(retrieval?.history);
  const candidates = Array.isArray(retrievalHistory?.candidates)
    ? retrievalHistory.candidates.map(recordOf).filter(Boolean)
    : [];
  const topCandidate = candidates[0];
  const topSimilarity = numberOf(topCandidate?.similarity);
  const passedThreshold =
    typeof topCandidate?.passed_threshold === "boolean"
      ? topCandidate.passed_threshold
      : null;
  const firstDeltaMs = numberOf(generationHistory?.first_delta_ms);
  const deltaCount = numberOf(generationHistory?.delta_count);
  const promptTokens = numberOf(generationHistory?.prompt_tokens);
  const completionTokens = numberOf(generationHistory?.completion_tokens);
  const totalTokens = numberOf(generationHistory?.total_tokens);
  const visibleCandidates = candidates.slice(0, 3);

  return (
    <div className="bg-surface-muted mt-3 space-y-3 rounded-xl px-3 py-3 dark:bg-white/5">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <TraceMetric
          label="전체 처리 시간"
          value={`${trace.trace.totalMs}ms`}
        />
        <TraceMetric
          label="검색 품질"
          value={
            topSimilarity === null
              ? "확인 불가"
              : `${topSimilarity.toFixed(3)} · ${passedThreshold === true ? "기준 통과" : passedThreshold === false ? "기준 미달" : "기준 미확인"}`
          }
        />
        <TraceMetric
          label="답변 시작"
          value={firstDeltaMs === null ? "확인 불가" : `${firstDeltaMs}ms`}
        />
        <TraceMetric
          label="토큰 사용량"
          value={
            totalTokens === null
              ? "확인 불가"
              : totalTokens.toLocaleString("ko-KR")
          }
        />
      </div>
      <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
        {trace.trace.flags.map((flag) => (
          <span
            key={`${flag.code}-${flag.spanId ?? "all"}`}
            className={cn(
              "rounded-full px-2 py-1",
              traceFlagStyles[flag.code] ?? traceFlagStyles.SKIPPED,
            )}
            title={flag.message}
          >
            {traceFlagLabels[flag.code] ?? flag.code}
          </span>
        ))}
      </div>
      <div>
        <p className="mb-2 text-xs font-extrabold text-gray-700 dark:text-gray-200">
          처리 단계
        </p>
        <div className="space-y-1.5">
          {trace.trace.spans.map((span, index) => (
            <div key={`${span.id ?? span.type}-${index}`}>
              <div className="flex items-start justify-between gap-3 text-xs">
                <span
                  className={cn(
                    "flex items-center gap-1.5",
                    span.skipped
                      ? "text-gray-400"
                      : "font-semibold text-gray-700 dark:text-gray-200",
                  )}
                >
                  <span>{traceSpanLabels[span.type] ?? span.type}</span>
                  {span.skipped && (
                    <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-white/10 dark:text-gray-400">
                      건너뜀
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-gray-400">
                  {span.tookMs ?? "-"}ms
                </span>
              </div>
              {span.skipped && (
                <p className="ml-1 text-[11px] text-gray-400">
                  사유: {span.skipped}
                </p>
              )}
              {span.error && (
                <p className="ml-1 text-[11px] font-semibold text-red-600 dark:text-red-300">
                  오류: {traceErrorMessage(span.error)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg bg-white/70 p-3 dark:bg-black/10">
          <p className="text-xs font-extrabold">검색 후보</p>
          {candidates.length ? (
            <>
              <p className="mt-1 text-[11px] text-gray-500">
                전체 {candidates.length}개 · 1위{" "}
                {passedThreshold === true
                  ? "기준 통과"
                  : passedThreshold === false
                    ? "기준 미달"
                    : "상태 미확인"}
              </p>
              <div className="mt-2 space-y-1.5">
                {visibleCandidates.map((candidate, index) => {
                  const similarity = numberOf(candidate?.similarity);
                  const passed = candidate?.passed_threshold;
                  return (
                    <div
                      key={`${index}-${similarity ?? "unknown"}`}
                      className="flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="font-semibold text-gray-600 dark:text-gray-300">
                        {index + 1}위 후보
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          passed === true
                            ? "text-emerald-600 dark:text-emerald-300"
                            : passed === false
                              ? "text-orange-600 dark:text-orange-300"
                              : "text-gray-500",
                        )}
                      >
                        {similarity === null
                          ? "유사도 확인 불가"
                          : `${similarity.toFixed(3)} · ${passed === true ? "통과" : passed === false ? "미달" : "미확인"}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="mt-1 text-[11px] text-gray-500">
              검색 후보 기록이 없어요.
            </p>
          )}
        </div>
        <div className="rounded-lg bg-white/70 p-3 dark:bg-black/10">
          <p className="text-xs font-extrabold">응답 효율</p>
          <p className="mt-1 text-[11px] text-gray-500">
            첫 조각 {firstDeltaMs === null ? "-" : `${firstDeltaMs}ms`} · 조각
            수 {deltaCount ?? "-"}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            입력 {promptTokens ?? "-"} · 출력 {completionTokens ?? "-"} · 전체{" "}
            {totalTokens ?? "-"}
          </p>
        </div>
      </div>
    </div>
  );
};

const TraceMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-white/70 px-3 py-2 dark:bg-black/10">
    <p className="text-[11px] font-bold text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-extrabold text-gray-800 dark:text-gray-100">
      {value}
    </p>
  </div>
);
