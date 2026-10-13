import type { AdminChatStats } from "@/features/admin/types";

const formatCount = (value: number | undefined, isLoading: boolean) =>
  isLoading || value === undefined ? "-" : value.toLocaleString("ko-KR");

/** 답변 피드백 통계 카드 3개. 대시보드와 답변 피드백 페이지가 같은 문구로 쓴다. */
export const getChatFeedbackStatItems = (
  summary: AdminChatStats["summary"] | undefined,
  isLoading: boolean,
) => [
  {
    label: "답변 피드백",
    value: formatCount(summary?.unresolvedCount, isLoading),
    helper: "보완이 필요한 질문",
  },
  {
    label: "반복 문의",
    value: formatCount(summary?.repeatCount, isLoading),
    helper: "피드백 누적 발생",
  },
  {
    label: "오늘 발생",
    value: formatCount(summary?.todayCount, isLoading),
    helper: "오늘 마지막으로 나온 질문",
  },
];
