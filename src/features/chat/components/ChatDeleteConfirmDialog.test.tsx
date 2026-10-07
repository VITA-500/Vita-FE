import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatDeleteConfirmDialog } from "./ChatDeleteConfirmDialog";

describe("ChatDeleteConfirmDialog", () => {
  it("shows the chat title and calls the handlers", async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByRole("button", { name: "삭제" }));
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
