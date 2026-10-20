import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatAccountMenu } from "@/features/chat/sidebar/components/ChatAccountMenu";

describe("chat account menu", () => {
  it("keeps profile and settings navigation without history usage settings", () => {
    const onOpenProfile = vi.fn();
    const onOpenSettings = vi.fn();
    render(
      <ChatAccountMenu
        displayName="테스트 사용자"
        onLogout={vi.fn()}
        onOpenProfile={onOpenProfile}
        onOpenSettings={onOpenSettings}
        onStartTour={vi.fn()}
      />,
    );
    expect(screen.queryByText("상담 기록 활용")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "설정" }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "테스트 사용자" }));
    expect(onOpenProfile).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: "로그아웃" }),
    ).toBeInTheDocument();
  });
});
