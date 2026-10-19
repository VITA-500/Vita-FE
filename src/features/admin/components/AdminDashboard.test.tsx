import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "./AdminDashboard";
import { useAdminAnswerFeedback } from "../context/useAdminAnswerFeedback";

vi.mock("../context/useAdminAnswerFeedback", () => ({
  useAdminAnswerFeedback: vi.fn(),
}));
vi.mock("./AnswerFeedbackContent", () => ({
  AnswerFeedbackContent: () => <div>피드백 목록</div>,
}));

beforeEach(() => {
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
  it("prioritizes repeat and today counts and removes member metrics", () => {
    render(<AdminDashboard />);
    const metrics = within(
      screen.getByRole("region", { name: "운영 주요 지표" }),
    );
    expect(
      metrics.getByRole("heading", { name: "반복 문의" }),
    ).toBeInTheDocument();
    expect(
      metrics.getByRole("heading", { name: "오늘 발생" }),
    ).toBeInTheDocument();
    expect(metrics.getAllByRole("heading")).toHaveLength(3);
    expect(
      metrics.getByRole("heading", { name: "답변 피드백" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("데이터 점검")).not.toBeInTheDocument();
    expect(screen.queryByText("데이터 품질 점검")).not.toBeInTheDocument();
    expect(metrics.getByText("24")).toBeInTheDocument();
    expect(metrics.getByText("128")).toBeInTheDocument();
    expect(metrics.getByText("12")).toBeInTheDocument();
    for (const label of ["전체 회원", "활성 회원", "정지 회원", "관리자 회원"])
      expect(screen.queryByText(label)).not.toBeInTheDocument();
  });

  it("shows today's reactions and occurrence counts by reason", () => {
    render(<AdminDashboard />);
    const section = within(
      screen.getByRole("region", { name: "오늘 사용자 반응과 사유별 발생" }),
    );
    expect(
      section.getByRole("heading", { name: "오늘 좋아요" }),
    ).toBeInTheDocument();
    expect(section.getByText("31")).toBeInTheDocument();
    expect(section.getByText("5")).toBeInTheDocument();
    expect(section.getByText("검색 결과 없음")).toBeInTheDocument();
    expect(section.getByText("40")).toBeInTheDocument();
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
    expect(screen.getAllByText("조회 실패")).toHaveLength(6);
    expect(
      screen.queryByText("점검할 누락 항목이 없습니다."),
    ).not.toBeInTheDocument();
  });
});
