"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ArrowLeft, LockKeyhole, Mail, UserRound } from "lucide-react";
import { authService } from "@/features/auth/lib/authService";
import { tokenStorage } from "@/features/auth/lib/tokenStorage";
import { TextField } from "@/shared/ui/TextField";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/Button";
import { routes } from "@/shared/constants/routes";
import { Logo } from "@/shared/ui/Logo";
import { showToast } from "@/shared/ui/ToastProvider";

type AuthMode = "login" | "signup";

const socialProviders = [
  {
    name: "Google",
    icon: "/images/icon-google.svg",
    className:
      "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300",
  },
  {
    name: "Kakao",
    icon: "/images/icon-kakao.svg",
    className: "border-[#FEE500] bg-[#FEE500] hover:bg-[#F6DD00]",
  },
  {
    name: "Naver",
    icon: "/images/icon-naver.svg",
    className: "border-[#03C75A] bg-[#03C75A] hover:bg-[#02B350]",
  },
] as const;

const LoginPage = () => {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isLogin = mode === "login";

  const resetFeedback = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleModeChange = () => {
    resetFeedback();
    setMode(isLogin ? "signup" : "login");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();

    if (!email.trim() || !password) {
      setErrorMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        setErrorMessage("이름을 입력해주세요.");
        return;
      }

      if (password.length < 8) {
        setErrorMessage("비밀번호는 8자 이상이어야 합니다.");
        return;
      }

      if (password !== passwordConfirm) {
        setErrorMessage("비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        await authService.login({
          email: email.trim(),
          password,
        });

        tokenStorage.setAuthHint();
        await authService.getMe();
        window.dispatchEvent(new Event("vita-auth-changed"));
        showToast("로그인되었습니다.");
        router.push(routes.chat);
        return;
      }

      await authService.signup({
        email: email.trim(),
        name: name.trim(),
        password,
      });

      setMode("login");
      setPassword("");
      setPasswordConfirm("");
      setSuccessMessage("회원가입이 완료되었습니다. 로그인해주세요.");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "요청 처리 중 문제가 발생했습니다.";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-surface-warm flex min-h-screen items-center justify-center px-6 py-10 text-gray-950 dark:text-white">
      <div className="w-full max-w-[500px]">
        {/* 돌아가기 */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={19} />
          돌아가기
        </button>

        <div className="w-full rounded-[32px] border border-white bg-white/90 p-6 shadow-[0_24px_80px_rgba(25,31,40,0.12)] backdrop-blur sm:p-8 dark:border-white/10 dark:bg-zinc-950/90">
          {/* 로고 */}
          <div className="mb-7 flex justify-center">
            <Logo
              href={routes.home}
              priority
              heightClassName="h-14"
              className="justify-center"
            />
          </div>

          {/* 제목 */}
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {isLogin ? "로그인" : "회원가입"}
            </h1>

            <p className="mt-2 text-sm leading-6 font-medium text-gray-500 dark:text-gray-400">
              {isLogin
                ? "계정으로 접속하면 상담 기록을 계속 이어볼 수 있어요."
                : "간단한 정보만 입력하면 VITA 상담을 시작할 수 있어요."}
            </p>
          </div>

          {/* 폼 */}
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <TextField
                label="이름"
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                placeholder="이름을 입력하세요"
                icon={<UserRound size={19} />}
              />
            )}

            <TextField
              label="이메일"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="이메일을 입력하세요"
              icon={<Mail size={19} />}
            />

            <TextField
              label="비밀번호"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="비밀번호를 입력하세요"
              icon={<LockKeyhole size={19} />}
            />

            {!isLogin && (
              <TextField
                label="비밀번호 확인"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                type="password"
                placeholder="비밀번호를 한 번 더 입력하세요"
                icon={<LockKeyhole size={19} />}
              />
            )}

            {(errorMessage || successMessage) && (
              <p
                className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                  errorMessage
                    ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                }`}
                role="status"
              >
                {errorMessage || successMessage}
              </p>
            )}

            {/* 로그인 / 회원가입 버튼 */}
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="shadow-brand/20 mt-2 w-full shadow-lg"
            >
              {isSubmitting ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
            </Button>
          </form>

          {/* 로그인 / 회원가입 전환 */}
          <div className="mt-5 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
            {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}

            <button
              type="button"
              onClick={handleModeChange}
              className="text-brand hover:text-brand-hover ml-2 cursor-pointer font-extrabold transition"
            >
              {isLogin ? "회원가입" : "로그인"}
            </button>
          </div>

          {/* 구분선 */}
          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />

            <span className="text-xs font-bold text-gray-400">또는</span>

            <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
          </div>

          {/* 소셜 로그인 */}
          <div className="flex items-center justify-center gap-4">
            {socialProviders.map((provider) => (
              <button
                key={provider.name}
                aria-label={`${provider.name}로 계속하기`}
                title={`${provider.name}로 계속하기`}
                type="button"
                onClick={() =>
                  setErrorMessage("소셜 로그인은 아직 준비 중입니다.")
                }
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${provider.className}`}
              >
                <Image
                  src={provider.icon}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </button>
            ))}
          </div>

          <p className="mt-4 text-center text-xs font-medium text-gray-400">
            간편 로그인으로 빠르게 시작할 수 있어요.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
