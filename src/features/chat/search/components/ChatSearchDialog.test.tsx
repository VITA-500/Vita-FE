import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatSearchDialog } from "@/features/chat/search/components/ChatSearchDialog";

const sessions = [
  { sessionId: 1, title: "요금제 변경", updatedAt: "2026-10-14T23:59:59" },
  { sessionId: 2, title: "요금제 추천", updatedAt: "2026-10-15T00:00:00" },
  { sessionId: 3, title: "매장 찾기", updatedAt: "2026-10-16T23:59:59" },
];

const setup = () => {
  const props = {
    chatSessions: sessions,
    currentChatTitle: "요금제 추천",
    currentSessionId: 2,
    isOpen: true,
    onClose: vi.fn(),
    onSelectChat: vi.fn(),
  };
  return { ...render(<ChatSearchDialog {...props} />), props };
};

const choosePeriod = (name: string) => {
  fireEvent.click(screen.getByRole("button", { name: "조회 기간" }));
  fireEvent.click(screen.getByRole("option", { name }));
};

describe("chat search date range", () => {
  it("replaces redundant tabs with a period dropdown and a single day filter", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByPlaceholderText("검색...")).toHaveFocus(),
    );
    expect(
      screen.queryByRole("button", { name: "전체" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "채팅" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("검색 시작일")).not.toBeInTheDocument();
    choosePeriod("특정 날짜");
    fireEvent.change(screen.getByLabelText("검색 날짜"), {
      target: { value: "2026-10-15" },
    });
    expect(
      screen.getByRole("button", { name: /요금제 추천/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /매장 찾기/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("상담 1개")).toBeInTheDocument();
    choosePeriod("전체 기간");
    expect(screen.queryByLabelText("검색 날짜")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /매장 찾기/ }),
    ).toBeInTheDocument();
  });
  it("includes both boundary days and combines dates with the keyword", async () => {
    const { props } = setup();
    await waitFor(() =>
      expect(screen.getByPlaceholderText("검색...")).toHaveFocus(),
    );
    choosePeriod("기간 직접 선택");
    fireEvent.change(screen.getByLabelText("검색 시작일"), {
      target: { value: "2026-10-15" },
    });
    fireEvent.change(screen.getByLabelText("검색 종료일"), {
      target: { value: "2026-10-16" },
    });
    expect(
      screen.queryByRole("button", { name: /요금제 변경/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /매장 찾기/ }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("검색..."), {
      target: { value: "요금제" },
    });
    expect(
      screen.queryByRole("button", { name: /매장 찾기/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /요금제 추천/ }));
    expect(props.onSelectChat).toHaveBeenCalledWith(2);
  });

  it("supports a single date, clearing dates, and invalid ranges", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByPlaceholderText("검색...")).toHaveFocus(),
    );
    choosePeriod("기간 직접 선택");
    fireEvent.change(screen.getByLabelText("검색 종료일"), {
      target: { value: "2026-10-14" },
    });
    expect(
      screen.getByRole("button", { name: /요금제 변경/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /요금제 추천/ }),
    ).not.toBeInTheDocument();
    choosePeriod("기간 직접 선택");
    fireEvent.change(screen.getByLabelText("검색 시작일"), {
      target: { value: "2026-10-16" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("종료일은 시작일 이후");
    expect(screen.getByText("검색 결과가 없습니다")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "날짜 초기화" }));
    expect(
      screen.getByRole("button", { name: /요금제 추천/ }),
    ).toBeInTheDocument();
  });

  it("resets the range when reopened", async () => {
    const { props, rerender } = setup();
    await waitFor(() =>
      expect(screen.getByPlaceholderText("검색...")).toHaveFocus(),
    );
    choosePeriod("기간 직접 선택");
    fireEvent.change(screen.getByLabelText("검색 시작일"), {
      target: { value: "2026-10-16" },
    });
    rerender(<ChatSearchDialog {...props} onClose={vi.fn()} />);
    expect(screen.getByLabelText("검색 시작일")).toHaveValue("2026-10-16");
    rerender(<ChatSearchDialog {...props} isOpen={false} />);
    rerender(<ChatSearchDialog {...props} />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "조회 기간" }),
      ).toHaveTextContent("전체 기간"),
    );
  });

  it("opens one range calendar for the direct period selection", async () => {
    setup();
    await waitFor(() =>
      expect(screen.getByPlaceholderText("검색...")).toHaveFocus(),
    );
    choosePeriod("기간 직접 선택");
    fireEvent.click(screen.getByRole("button", { name: "검색 기간 선택" }));

    expect(
      screen.getByRole("dialog", { name: "검색 기간 달력" }),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText("검색 시작일")).toHaveLength(1);
    expect(screen.getAllByLabelText("검색 종료일")).toHaveLength(1);
  });
});
