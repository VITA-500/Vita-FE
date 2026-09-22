import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GuestNewChatDialog } from "./GuestNewChatDialog";

describe("GuestNewChatDialog", () => {
  it("explains that guest chats are deleted unless the user signs up or logs in", () => {
    render(<GuestNewChatDialog onCancel={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "현재 채팅을 지울까요?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("회원가입")).toHaveClass("font-extrabold");
    expect(screen.getByText("로그인", { selector: "span" })).toHaveClass(
      "font-extrabold",
    );
    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("calls the proper handlers for close and clear actions", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(<GuestNewChatDialog onCancel={onCancel} onConfirm={onConfirm} />);

    await user.click(screen.getByRole("button", { name: "채팅 지우기" }));
    await user.click(screen.getByRole("button", { name: "닫기" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
