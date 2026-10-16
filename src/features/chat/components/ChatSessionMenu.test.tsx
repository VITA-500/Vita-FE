import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatSessionMenu } from "./ChatSessionMenu";

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
});
