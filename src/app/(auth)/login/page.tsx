"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "./_components/AuthForm";
import { SocialLoginButtons } from "./_components/SocialLoginButtons";
import { useAuthForm } from "./_hooks/useAuthForm";
import { routes } from "@/shared/constants/routes";
import { Logo } from "@/shared/ui/atoms/Logo";
import { readLoginReturnToFromLocation } from "@/entities/user";

const LoginPage = () => {
  const router = useRouter();
  const form = useAuthForm();
  const { isLogin } = form;

  return (
    <section className="bg-surface-warm flex min-h-screen items-center justify-center px-6 py-10 text-gray-950 dark:text-white">
      <div className="w-full max-w-[500px]">
        {/* 돌아가기 */}
        <button
          type="button"
          onClick={() =>
            router.replace(readLoginReturnToFromLocation() ?? routes.chat)
          }
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

          <AuthForm form={form} />

          {/* 로그인 / 회원가입 전환 */}
          <div className="mt-5 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
            {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}

            <button
              type="button"
              onClick={form.toggleMode}
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

          <SocialLoginButtons onBeforeRedirect={form.resetFeedback} />
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
