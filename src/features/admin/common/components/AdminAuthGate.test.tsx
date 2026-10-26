import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AdminAuthGate } from "./AdminAuthGate";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  auth: {
    isAuthenticated: false,
    isLoading: false,
    isReady: true,
    user: null as null | { role: string },
  },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/entities/user", async (original) => ({
  ...(await original<typeof import("@/entities/user")>()),
  useAuthUser: () => mocks.auth,
}));
beforeEach(() => {
  mocks.replace.mockReset();
  mocks.auth = {
    isAuthenticated: false,
    isLoading: false,
    isReady: true,
    user: null,
  };
});
it("redirects a guest without rendering administrator content", async () => {
  render(
    <AdminAuthGate>
      <p>관리자 콘텐츠</p>
    </AdminAuthGate>,
  );
  await waitFor(() => expect(mocks.replace).toHaveBeenCalled());
  expect(screen.queryByText("관리자 콘텐츠")).not.toBeInTheDocument();
});
it("blocks ordinary members", () => {
  mocks.auth = { ...mocks.auth, isAuthenticated: true, user: { role: "USER" } };
  render(
    <AdminAuthGate>
      <p>관리자 콘텐츠</p>
    </AdminAuthGate>,
  );
  expect(screen.getByText("관리자 권한이 필요합니다")).toBeInTheDocument();
  expect(screen.queryByText("관리자 콘텐츠")).not.toBeInTheDocument();
});
it("renders administrator content for an administrator", () => {
  mocks.auth = {
    ...mocks.auth,
    isAuthenticated: true,
    user: { role: "ADMIN" },
  };
  render(
    <AdminAuthGate>
      <p>관리자 콘텐츠</p>
    </AdminAuthGate>,
  );
  expect(screen.getByText("관리자 콘텐츠")).toBeInTheDocument();
});
