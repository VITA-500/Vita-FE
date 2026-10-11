import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatDeleteConfirmDialog } from "./ChatDeleteConfirmDialog";

describe("ChatDeleteConfirmDialog", () => {
  it("shows the chat title and calls the handlers", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ChatDeleteConfirmDialog
        title="요금제 추천"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "상담을 삭제할까요?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("요금제 추천")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    fireEvent.click(screen.getByRole("button", { name: "취소" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
