import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatProgressSteps } from "@/features/chat/message/components/ChatProgressSteps";

const currentStatus = () => screen.getByRole("status").textContent;

describe("ChatProgressSteps", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("FAQ·요금제 검색에 함께 쓰는 문구를 보여준다", () => {
    render(<ChatProgressSteps stage="retrieving" />);

    expect(currentStatus()).toBe("관련 정보를 찾고 있어요");
    expect(screen.getByText("질문을 확인했어요")).toBeTruthy();
  });

  it("매장 질문이면 검색 단계를 매장 기준 문구로 보여준다", () => {
    render(<ChatProgressSteps stage="retrieving" isStorePrompt />);

    expect(currentStatus()).toBe("주변 매장 정보를 찾고 있어요");
  });

  it("위치를 확인하는 동안에는 위치 단계만 보여주고 시간 기준 진행을 멈춘다", () => {
    const { rerender } = render(
      <ChatProgressSteps location="locating" isStorePrompt />,
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(currentStatus()).toBe("위치를 확인하고 있어요");
    expect(screen.queryByText(/질문을 확인/)).toBeNull();

    rerender(<ChatProgressSteps location="located" isStorePrompt />);
    expect(screen.getByText("위치를 확인했어요")).toBeTruthy();
    expect(currentStatus()).toBe("질문을 확인하고 있어요");
  });

  it("위치를 못 얻으면 위치 없이 진행한다고 보여준다", () => {
    render(<ChatProgressSteps location="unavailable" isStorePrompt />);

    expect(screen.getByText("위치 없이 찾아볼게요")).toBeTruthy();
  });

  it("한 단계에 오래 머물면 앞 줄을 끝난 것으로 남기고 다음 줄을 덧붙인다", () => {
    const { rerender } = render(<ChatProgressSteps stage="understanding" />);

    expect(currentStatus()).toBe("질문을 확인하고 있어요");
    act(() => {
      vi.advanceTimersByTime(4200);
    });
    expect(screen.getByText("질문을 확인했어요")).toBeTruthy();
    expect(currentStatus()).toBe("질문 의도를 파악하고 있어요");

    // 다음 단계로 넘어가도 앞 단계의 두 줄은 기록으로 남는다.
    rerender(<ChatProgressSteps stage="retrieving" />);
    expect(screen.getByText("질문을 확인했어요")).toBeTruthy();
    expect(screen.getByText("질문 의도를 파악했어요")).toBeTruthy();
    expect(currentStatus()).toBe("관련 정보를 찾고 있어요");
  });

  it("시간 기준으로 넘어간 단계에서 뒤로 돌아가지 않는다", () => {
    const { rerender } = render(<ChatProgressSteps />);

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(currentStatus()).toBe("관련 정보를 찾고 있어요");

    rerender(<ChatProgressSteps stage="understanding" />);
    expect(currentStatus()).toBe("관련 정보를 찾고 있어요");
  });

  it("저장된 답변을 다시 불러오는 중이면 마지막 줄로 알린다", () => {
    render(<ChatProgressSteps stage="generating" recovery="disconnected" />);

    expect(currentStatus()).toBe(
      "연결이 잠시 끊겨 답변을 다시 불러오고 있어요",
    );
    expect(screen.getByText("답변을 정리했어요")).toBeTruthy();
  });

  it("BE 재시도 중이면 한 번 더 시도하고 있다고 알린다", () => {
    render(<ChatProgressSteps stage="generating" recovery="retrying" />);

    expect(currentStatus()).toBe("응답을 찾지 못해 한 번 더 시도하고 있어요");
  });
});
