"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, LockKeyhole, Mail, UserRound } from "lucide-react";
import { TextField } from "@/shared/ui/TextField";
import { ButtonLink } from "@/shared/ui/Button";
import { routes } from "@/shared/constants/routes";
import { Logo } from "@/shared/ui/Logo";

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

  const isLogin = mode === "login";

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface-warm px-6 py-10 text-gray-950 dark:text-white">
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

        <div className="w-full rounded-[32px] border border-white bg-white/90 p-6 shadow-[0_24px_80px_rgba(25,31,40,0.12)] backdrop-blur dark:border-white/10 dark:bg-zinc-950/90 sm:p-8">
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

            <p className="mt-2 text-sm font-medium leading-6 text-gray-500 dark:text-gray-400">
              {isLogin
                ? "계정으로 접속하면 상담 기록을 계속 이어볼 수 있어요."
                : "간단한 정보만 입력하면 VITA 상담을 시작할 수 있어요."}
            </p>
          </div>

          {/* 폼 */}
          <form className="mt-8 space-y-4">
            {!isLogin && (
              <TextField
                label="이름"
                type="text"
                placeholder="이름을 입력하세요"
                icon={<UserRound size={19} />}
              />
            )}

            <TextField
              label="이메일"
              type="email"
              placeholder="이메일을 입력하세요"
              icon={<Mail size={19} />}
            />

            <TextField
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력하세요"
              icon={<LockKeyhole size={19} />}
            />

            {!isLogin && (
              <TextField
                label="비밀번호 확인"
                type="password"
                placeholder="비밀번호를 한 번 더 입력하세요"
                icon={<LockKeyhole size={19} />}
              />
            )}

            {/* 로그인 / 회원가입 버튼 */}
            <ButtonLink
              href={routes.chat}
              size="lg"
              className="mt-2 w-full shadow-lg shadow-brand/20"
            >
              {isLogin ? "로그인" : "회원가입"}
            </ButtonLink>
          </form>

          {/* 로그인 / 회원가입 전환 */}
          <div className="mt-5 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
            {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}

            <button
              type="button"
              onClick={() => setMode(isLogin ? "signup" : "login")}
              className="ml-2 cursor-pointer font-extrabold text-brand transition hover:text-brand-hover"
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
              <Link
                key={provider.name}
                href={routes.chat}
                aria-label={`${provider.name}로 계속하기`}
                title={`${provider.name}로 계속하기`}
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${provider.className}`}
              >
                <Image
                  src={provider.icon}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
              </Link>
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
