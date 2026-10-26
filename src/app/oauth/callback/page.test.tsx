import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import OAuthCallbackPage from "./page";

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  replace: vi.fn(),
  setAuthHint: vi.fn(),
  removeAuthHint: vi.fn(),
  takeReturn: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/auth", () => ({ authService: { getMe: mocks.getMe } }));
vi.mock("@/entities/user", () => ({
  LOGIN_RETURN_PARAM: "returnTo",
  takeRememberedLoginReturnTo: mocks.takeReturn,
  buildLoginHref: (path: string | null) =>
    path ? `/login?returnTo=${encodeURIComponent(path)}` : "/login",
  tokenStorage: {
    setAuthHint: mocks.setAuthHint,
    removeAuthHint: mocks.removeAuthHint,
  },
}));
vi.mock("@/shared/providers/ToastProvider", () => ({ showToast: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.takeReturn.mockReturnValue("/chat?mode=store");
});

it("completes once under StrictMode and preserves the original chat mode", async () => {
  mocks.getMe.mockResolvedValue({ userId: 1 });
  render(
    <StrictMode>
      <OAuthCallbackPage />
    </StrictMode>,
  );
  await waitFor(() =>
    expect(mocks.replace).toHaveBeenCalledWith("/chat?mode=store"),
  );
  expect(mocks.getMe).toHaveBeenCalledTimes(1);
  expect(mocks.takeReturn).toHaveBeenCalledTimes(1);
});

it("manual login return preserves the destination and ignores a late result", async () => {
  let resolve!: (user: unknown) => void;
  mocks.getMe.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  render(<OAuthCallbackPage />);
  await waitFor(() => expect(mocks.getMe).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("link", { name: "로그인으로 돌아가기" }));
  expect(mocks.replace).toHaveBeenCalledWith(
    "/login?returnTo=%2Fchat%3Fmode%3Dstore",
  );
  await act(async () => resolve({ userId: 1 }));
  expect(mocks.replace).toHaveBeenCalledTimes(1);
  expect(mocks.setAuthHint).not.toHaveBeenCalled();
});
