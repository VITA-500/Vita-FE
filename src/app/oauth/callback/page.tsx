"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/features/auth/lib/authService";
import { tokenStorage } from "@/features/auth/lib/tokenStorage";
import { routes } from "@/shared/constants/routes";
import { Logo } from "@/shared/ui/Logo";
import { showToast } from "@/shared/ui/ToastProvider";

const oauthErrorMessages: Record<string, string> = {
  OAUTH_AUTHENTICATION_FAILED: "소셜 로그인에 실패했습니다.",
  OAUTH_EMAIL_CONFLICT: "이미 같은 이메일로 가입된 계정이 있습니다.",
};

const OAuthCallbackContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    const completeOAuthLogin = async () => {
      if (error) {
        const message =
          oauthErrorMessages[error] ?? "소셜 로그인에 실패했습니다.";

        showToast(message);
        router.replace(`${routes.login}?oauthError=${error}`);
        return;
      }

      try {
        await authService.getMe();
        tokenStorage.setAuthHint();
        window.dispatchEvent(new Event("vita-auth-changed"));
        showToast("로그인되었습니다.");
        router.replace(routes.chat);
      } catch {
        tokenStorage.removeAuthHint();
        showToast("로그인 정보를 확인하지 못했습니다.");
        router.replace(routes.login);
      }
    };

    void completeOAuthLogin();
  }, [error, router]);

  return (
    <section className="bg-surface-warm flex min-h-screen items-center justify-center px-6 text-gray-950 dark:text-white">
      <div className="w-full max-w-[360px] rounded-[28px] border border-white bg-white/90 p-7 text-center shadow-[0_24px_80px_rgba(25,31,40,0.12)] dark:border-white/10 dark:bg-zinc-950/90">
        <Logo
          href={routes.home}
          priority
          heightClassName="h-14"
          className="justify-center"
        />

        <h1 className="mt-7 text-xl font-extrabold">로그인 처리 중</h1>
        <p className="mt-3 text-sm leading-6 font-semibold text-gray-500 dark:text-gray-400">
          소셜 로그인 정보를 확인하고 있어요.
        </p>

        <Link
          href={routes.login}
          className="mt-7 inline-flex h-11 items-center justify-center rounded-full bg-gray-100 px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    </section>
  );
};

const OAuthCallbackPage = () => {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackContent />
    </Suspense>
  );
};

export default OAuthCallbackPage;
