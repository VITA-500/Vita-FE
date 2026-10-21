import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "@/features/admin/dashboard/components/AdminDashboard";
import { useAdminAnswerFeedback } from "@/features/admin/feedback/hooks/useAdminAnswerFeedback";
import { useAdminOperationsSummary } from "@/features/admin/dashboard/hooks/useAdminOperationsSummary";

vi.mock("@/features/admin/feedback/hooks/useAdminAnswerFeedback", () => ({
  useAdminAnswerFeedback: vi.fn(),
}));
vi.mock("@/features/admin/dashboard/hooks/useAdminOperationsSummary", () => ({
  useAdminOperationsSummary: vi.fn(),
}));
vi.mock("@/features/admin/dashboard/components/ReasonBarChart", () => ({
  ReasonBarChart: () => null,
}));

beforeEach(() => {
  vi.mocked(useAdminOperationsSummary).mockReturnValue({
    error: null,
    isLoading: false,
    summary: {
      phoneStores: 100,
      partnerStores: 250,
      benefits: 20,
      emptyBenefits: 2,
      activeFaqs: 7,
      suspendedUsers: 3,
    },
  });
  vi.mocked(useAdminAnswerFeedback).mockReturnValue({
    error: null,
    isLoading: false,
    stats: {
      summary: {
        repeatCount: 128,
        todayCount: 12,
        unresolvedCount: 24,
        todayLikeCount: 31,
        todayDislikeCount: 5,
        reasonCounts: {
          NO_MATCH: 40,
          LOW_SIMILARITY: 20,
          ANSWER_FAILED: 4,
          DISLIKED: 9,
        },
        todayReasonCounts: {
          NO_MATCH: 2,
          LOW_SIMILARITY: 1,
          ANSWER_FAILED: 0,
          DISLIKED: 3,
        },
      },
      candidates: [],
    },
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAdminAnswerFeedback>);
});

describe("AdminDashboard", () => {
  it("merges feedback targets with repeat count and keeps today count", () => {
    render(<AdminDashboard />);
    const metrics = within(
      screen.getByRole("region", { name: "운영 주요 지표" }),
    );
    expect(metrics.getAllByRole("heading")).toHaveLength(4);
    expect(
      metrics.getByRole("heading", { name: "보완 대상" }),
    ).toBeInTheDocument();
    expect(
      metrics.getByRole("heading", { name: "오늘 발생" }),
    ).toBeInTheDocument();
    expect(
      metrics.getByRole("heading", { name: "오늘 응답 품질 문제" }),
    ).toBeInTheDocument();
    expect(
      metrics.getByRole("heading", { name: "주요 품질 문제" }),
    ).toBeInTheDocument();
    expect(
      metrics.queryByRole("heading", { name: "반복 문의" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("데이터 점검")).not.toBeInTheDocument();
    expect(screen.queryByText("데이터 품질 점검")).not.toBeInTheDocument();
    expect(metrics.getByText("24")).toBeInTheDocument();
    expect(metrics.getByText("128")).toBeInTheDocument();
    expect(metrics.getByText("12")).toBeInTheDocument();
    for (const label of ["전체 회원", "활성 회원", "관리자 회원"])
      expect(screen.queryByText(label)).not.toBeInTheDocument();
  });

  it("shows today's reactions and occurrence counts by reason", () => {
    render(<AdminDashboard />);
    const section = within(
      screen.getByRole("region", { name: "오늘 사용자 반응과 사유별 발생" }),
    );
    expect(
      section.getByRole("heading", { name: "오늘 반응과 사유별 발생" }),
    ).toBeInTheDocument();
    expect(section.getByText("31")).toBeInTheDocument();
    expect(section.getByText("5")).toBeInTheDocument();
    expect(section.getByText("86%")).toBeInTheDocument();
    expect(section.getAllByText("검색 결과 없음").length).toBeGreaterThan(0);
    expect(section.getByText("40")).toBeInTheDocument();
  });

  it("shows operations counts with empty benefit warning", () => {
    render(<AdminDashboard />);
    const section = within(screen.getByRole("region", { name: "운영 현황" }));
    expect(section.getByText("350")).toBeInTheDocument();
    expect(section.getByText("직영 100곳 · 제휴 250곳")).toBeInTheDocument();
    expect(section.getByText("매장 연결 필요")).toBeInTheDocument();
    expect(
      section.getByText(/연결된 매장이 없는 혜택이 2개/),
    ).toBeInTheDocument();
    expect(section.getByText("7")).toBeInTheDocument();
    expect(
      section.getByRole("heading", { name: "정지 회원" }),
    ).toBeInTheDocument();
  });

  it("shows operations fetch failure separately", () => {
    vi.mocked(useAdminOperationsSummary).mockReturnValue({
      error: "운영 현황을 불러오지 못했어요.",
      isLoading: false,
      summary: null,
    });
    render(<AdminDashboard />);
    const section = within(screen.getByRole("region", { name: "운영 현황" }));
    expect(section.getAllByText("조회 실패")).toHaveLength(4);
  });

  it("links to the feedback page instead of listing questions", () => {
    render(<AdminDashboard />);
    expect(
      screen.getByRole("link", { name: "답변 피드백 보기" }),
    ).toHaveAttribute("href", "/admin/feedback");
    expect(screen.queryByText("챗봇 답변 피드백")).not.toBeInTheDocument();
  });

  it("highlights the most frequent reason first in the chart data", () => {
    render(<AdminDashboard />);
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    expect(within(rows[1]).getByText("검색 결과 없음")).toBeInTheDocument();
    expect(within(rows[4]).getByText("답변 실패")).toBeInTheDocument();
  });

  it("shows loading placeholders instead of dashes", () => {
    vi.mocked(useAdminAnswerFeedback).mockReturnValue({
      error: null,
      isLoading: true,
      stats: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAdminAnswerFeedback>);
    render(<AdminDashboard />);
    expect(
      screen.getAllByRole("status", { name: "통계 조회 중" }),
    ).toHaveLength(5);
    expect(screen.queryByText("-")).not.toBeInTheDocument();
    expect(
      screen.queryByText("점검할 누락 항목이 없습니다."),
    ).not.toBeInTheDocument();
  });

  it("distinguishes fetch failures from a zero count", () => {
    vi.mocked(useAdminAnswerFeedback).mockReturnValue({
      error: "조회 오류",
      isLoading: false,
      stats: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAdminAnswerFeedback>);
    render(<AdminDashboard />);
    expect(screen.getAllByText("조회 실패")).toHaveLength(5);
    expect(
      screen.queryByText("점검할 누락 항목이 없습니다."),
    ).not.toBeInTheDocument();
  });
});
