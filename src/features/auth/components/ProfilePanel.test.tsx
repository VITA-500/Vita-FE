import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ProfilePanel } from "./ProfilePanel";

const mocks = vi.hoisted(() => ({ updateMe: vi.fn(), refreshUser: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/entities/user", () => ({
  useAuthUser: () => ({
    isAuthenticated: true,
    isLoading: false,
    isReady: true,
    refreshUser: mocks.refreshUser,
    user: {
      userId: 1,
      name: "비타",
      email: null,
      role: "USER",
      hasPassword: true,
      linkedProviders: [],
    },
  }),
}));
vi.mock("@/features/auth/lib/authService", () => ({
  authService: { updateMe: mocks.updateMe },
}));
vi.mock("@/shared/providers/ToastProvider", () => ({ showToast: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateMe.mockResolvedValue({});
  mocks.refreshUser.mockResolvedValue(undefined);
});

it.each([" Abc123!x", "Abc123!x ", "abcdefgh"])(
  "rejects a password violating BE rules: %s",
  (password) => {
    render(<ProfilePanel />);
    fireEvent.change(screen.getByLabelText("새 비밀번호"), {
      target: { value: password },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "저장하기" }).closest("form")!,
    );
    expect(screen.getByRole("status")).toHaveTextContent("공백 없이");
    expect(mocks.updateMe).not.toHaveBeenCalled();
  },
);
it("submits a valid password unchanged", async () => {
  render(<ProfilePanel />);
  fireEvent.change(screen.getByLabelText("새 비밀번호"), {
    target: { value: "Abc123!x" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "저장하기" }).closest("form")!,
  );
  await waitFor(() =>
    expect(mocks.updateMe).toHaveBeenCalledWith({ password: "Abc123!x" }),
  );
});
