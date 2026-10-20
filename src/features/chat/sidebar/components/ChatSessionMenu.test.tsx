import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatSessionMenu } from "@/features/chat/sidebar/components/ChatSessionMenu";

const chat = {
  active: false,
  key: "session-12",
  sessionId: 12,
  title: "기존 상담 이름",
};

const renderMenu = (onRename: ReturnType<typeof vi.fn>) =>
  render(
    <ChatSessionMenu
      canManage
      chat={chat}
      isPinned={false}
      left={0}
      menuRef={{ current: null }}
      onDelete={vi.fn()}
      onRename={onRename}
      onTogglePin={vi.fn()}
      top={0}
    />,
  );

describe("ChatSessionMenu", () => {
  it("renames a saved chat with a trimmed title", async () => {
    const onRename = vi.fn().mockResolvedValue(true);
    renderMenu(onRename);

    fireEvent.click(screen.getByRole("button", { name: "이름 바꾸기" }));
    fireEvent.change(screen.getByRole("textbox", { name: "상담 이름" }), {
      target: { value: "  새 상담 이름  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() =>
      expect(onRename).toHaveBeenCalledWith(chat, "새 상담 이름"),
    );
    expect(screen.getByRole("button", { name: "이름 바꾸기" })).toBeVisible();
  });

  it("keeps the form open after a failed request so it can be retried", async () => {
    const onRename = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    renderMenu(onRename);

    fireEvent.click(screen.getByRole("button", { name: "이름 바꾸기" }));
    fireEvent.change(screen.getByRole("textbox", { name: "상담 이름" }), {
      target: { value: "재시도할 이름" },
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(onRename).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("textbox", { name: "상담 이름" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(onRename).toHaveBeenCalledTimes(2));
  });

  it("wraps a long title onto multiple lines instead of scrolling sideways", () => {
    renderMenu(vi.fn().mockResolvedValue(true));

    fireEvent.click(screen.getByRole("button", { name: "이름 바꾸기" }));
    const input = screen.getByRole("textbox", { name: "상담 이름" });

    fireEvent.change(input, {
      target: { value: "띄어쓰기없이아주긴상담이름".repeat(20) },
    });

    expect(input.tagName).toBe("TEXTAREA");
    expect(input).toHaveAttribute("wrap", "soft");
    expect(input).toHaveClass(
      "field-sizing-content",
      "resize-none",
      "overflow-x-hidden",
      "break-words",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("30자 이내로 입력해 주세요.")).toBeVisible();
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("submits the renamed title with Enter", async () => {
    const onRename = vi.fn().mockResolvedValue(true);
    renderMenu(onRename);

    fireEvent.click(screen.getByRole("button", { name: "이름 바꾸기" }));
    const textarea = screen.getByRole("textbox", { name: "상담 이름" });
    fireEvent.change(textarea, { target: { value: "Enter로 저장" } });
    fireEvent.keyDown(textarea, { key: "Enter" });

    await waitFor(() =>
      expect(onRename).toHaveBeenCalledWith(chat, "Enter로 저장"),
    );
  });

  it("shows the typed length but validates and saves with the server whitespace normalization", async () => {
    const onRename = vi.fn().mockResolvedValue(true);
    renderMenu(onRename);

    fireEvent.click(screen.getByRole("button", { name: "이름 바꾸기" }));
    const textarea = screen.getByRole("textbox", { name: "상담 이름" });
    fireEvent.change(textarea, {
      target: { value: `  ${"🙂".repeat(24)}\n  상담   기록  ` },
    });

    // 카운터는 입력한 그대로(공백·줄바꿈 포함, 이모지는 1자) 세고, 공백 정리 후 저장될 길이를 함께 보여준다.
    expect(screen.getByText("38/30 · 저장 시 30자")).toBeVisible();
    // 저장 가능 여부는 서버처럼 공백을 정리한 길이(30자) 기준이라 초과 안내가 뜨지 않는다.
    expect(screen.getByText("공백은 한 칸으로 정리돼요.")).toBeVisible();
    expect(screen.queryByText("30자 이내로 입력해 주세요.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(onRename).toHaveBeenCalledWith(
        chat,
        `${"🙂".repeat(24)} 상담 기록`,
      ),
    );
  });
});
