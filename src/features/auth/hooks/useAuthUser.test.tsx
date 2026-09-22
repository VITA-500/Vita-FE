import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/http";
import type { MyPageResponse } from "@/features/auth/types";
import { AuthProvider, useAuthUser } from "./useAuthUser";

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  hasAccessTokenHint: vi.fn(),
  logout: vi.fn(),
  removeAuthHint: vi.fn(),
  setAuthHint: vi.fn(),
}));

vi.mock("@/features/auth/lib/authService", () => ({
  authService: {
    getMe: mocks.getMe,
    logout: mocks.logout,
  },
}));

vi.mock("@/features/auth/lib/tokenStorage", () => ({
  tokenStorage: {
    hasAccessTokenHint: mocks.hasAccessTokenHint,
    removeAuthHint: mocks.removeAuthHint,
    setAuthHint: mocks.setAuthHint,
  },
}));

const user: MyPageResponse = {
  email: "vita@example.com",
  hasPassword: true,
  linkedProviders: [],
  name: "비타",
  role: "USER",
  userId: 1,
};

const AuthStateProbe = () => {
  const { isAuthenticated, isLoading, isReady, user } = useAuthUser();

  return (
    <div>
      <span data-testid="ready">{String(isReady)}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="name">{user?.name ?? "guest"}</span>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(
      () => undefined,
    );
    mocks.getMe.mockReset();
    mocks.logout.mockResolvedValue(undefined);
    mocks.hasAccessTokenHint.mockReset();
    mocks.removeAuthHint.mockReset();
    mocks.setAuthHint.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("marks guests as ready without requesting the user profile", async () => {
    mocks.hasAccessTokenHint.mockReturnValue(false);

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("true");
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("name")).toHaveTextContent("guest");
    expect(mocks.getMe).not.toHaveBeenCalled();
  });

  it("loads the current user when an auth hint exists", async () => {
    mocks.hasAccessTokenHint.mockReturnValue(true);
    mocks.getMe.mockResolvedValue(user);

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    });

    expect(screen.getByTestId("name")).toHaveTextContent("비타");
    expect(mocks.setAuthHint).toHaveBeenCalled();
  });

  it("clears the auth hint when the profile request is unauthorized", async () => {
    mocks.hasAccessTokenHint.mockReturnValue(true);
    mocks.getMe.mockRejectedValue(new ApiError("로그인이 필요합니다.", 401));

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("true");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(mocks.removeAuthHint).toHaveBeenCalled();
  });
});
