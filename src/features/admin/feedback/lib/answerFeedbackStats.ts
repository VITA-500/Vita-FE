import type { AdminAnswerFeedbackStats } from "@/entities/feedback";

/**
 * 답변 피드백 페이지 제목 아래 한 줄 요약. 대시보드 지표와 같은 값을 짧게 보여준다.
 * 예: "보완 대상 24개 · 누적 128회 · 오늘 12건"
 */
export const getAnswerFeedbackSummaryText = (
  summary: AdminAnswerFeedbackStats["summary"],
) =>
  [
    `보완 대상 ${summary.unresolvedCount.toLocaleString("ko-KR")}개`,
    `누적 ${summary.repeatCount.toLocaleString("ko-KR")}회`,
    `오늘 ${summary.todayCount.toLocaleString("ko-KR")}건`,
  ].join(" · ");
