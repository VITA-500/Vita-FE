"use client";

import { cn } from "@/shared/lib/cn";
import { useAdminTrace } from "@/features/admin/feedback/hooks/useAdminTrace";

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

export const FeedbackTraceInline = ({
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
