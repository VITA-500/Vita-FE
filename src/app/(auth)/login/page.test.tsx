import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  login: vi.fn(),
  getMe: vi.fn(),
  signup: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    back: mocks.back,
    replace: mocks.replace,
  }),
}));
vi.mock("@/features/auth/lib/authService", () => ({
  authService: {
    login: mocks.login,
    getMe: mocks.getMe,
    signup: mocks.signup,
    createOAuthAuthorizationUrl: (provider: string) => `/oauth/${provider}`,
  },
}));
vi.mock("@/shared/providers/ToastProvider", () => ({
  showToast: mocks.showToast,
}));

const type = async (label: string, value: string) =>
  userEvent.type(screen.getByLabelText(label), value);

describe("LoginPage", () => {
  it("돌아가기는 인증 기록 대신 채팅 화면으로 이동한다", async () => {
    render(<LoginPage />);
    await userEvent.click(screen.getByRole("button", { name: "돌아가기" }));
    expect(mocks.replace).toHaveBeenCalledWith("/chat");
    expect(mocks.back).not.toHaveBeenCalled();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.login.mockResolvedValue({});
    mocks.getMe.mockResolvedValue({});
    mocks.signup.mockResolvedValue({});
  });

  it("이메일·비밀번호가 없으면 요청하지 않고 안내한다", async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(screen.getByRole("status").textContent).toBe(
      "이메일과 비밀번호를 입력해주세요.",
    );
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it("로그인에 성공하면 채팅 화면으로 이동한다", async () => {
    render(<LoginPage />);

    await type("이메일", " user@vita.dev ");
    await type("비밀번호", "password1");
    await userEvent.click(screen.getByRole("button", { name: "로그인" }));

    expect(mocks.login).toHaveBeenCalledWith({
      email: "user@vita.dev",
      password: "password1",
    });
    expect(mocks.push).toHaveBeenCalledWith("/chat");
  });

  it("회원가입은 비밀번호 규칙을 확인하고, 완료되면 로그인 화면으로 돌아온다", async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: "회원가입" }));
    expect(screen.getByRole("heading", { name: "회원가입" })).toBeTruthy();

    await type("이름", "홍길동");
    await type("이메일", "user@vita.dev");
    await type("비밀번호", "short");
    await type("비밀번호 확인", "short");
    await userEvent.click(
      screen.getAllByRole("button", { name: "회원가입" }).at(0)!,
    );
    expect(screen.getByRole("status").textContent).toBe(
      "비밀번호는 8자 이상이어야 합니다.",
    );

    await userEvent.clear(screen.getByLabelText("비밀번호"));
    await userEvent.clear(screen.getByLabelText("비밀번호 확인"));
    await type("비밀번호", "password1");
    await type("비밀번호 확인", "password1");
    await userEvent.click(
      screen.getAllByRole("button", { name: "회원가입" }).at(0)!,
    );

    expect(mocks.signup).toHaveBeenCalledWith({
      email: "user@vita.dev",
      name: "홍길동",
      password: "password1",
    });
    expect(screen.getByRole("heading", { name: "로그인" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "회원가입이 완료되었습니다. 로그인해주세요.",
    );
  });
});
