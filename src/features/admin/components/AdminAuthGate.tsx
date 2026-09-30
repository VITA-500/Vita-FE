"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { routes } from "@/shared/constants/routes";
import { ButtonLink } from "@/shared/ui/Button";
import { Card, CardContent } from "@/shared/ui/Card";

type AdminAuthGateProps = {
  children: ReactNode;
};

export const AdminAuthGate = ({ children }: AdminAuthGateProps) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, isReady, user } = useAuthUser();
  const isAdmin = user?.role === "ADMIN";
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isDevelopment) return;
    if (!isReady || isLoading || isAuthenticated) return;

    router.replace(routes.login);
  }, [isAuthenticated, isDevelopment, isLoading, isReady, router]);

  if (isDevelopment) {
    return children;
  }

  if (!isReady || isLoading) {
    return (
      <main className="bg-surface-warm flex min-h-screen items-center justify-center px-6">
        <div className="space-y-4" aria-label="관리자 권한 확인 중">
          <div className="bg-surface-muted h-4 w-40 animate-pulse rounded-full" />
          <div className="bg-surface-muted h-12 w-72 animate-pulse rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <main className="bg-surface-warm flex min-h-screen items-center justify-center px-6">
        <Card className="max-w-md text-center">
          <CardContent className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-950 dark:text-white">
                관리자 권한이 필요합니다
              </h1>
              <p className="text-text-secondary mt-3 text-sm leading-6 font-medium">
                이 화면은 관리자 계정으로만 접근할 수 있습니다.
              </p>
            </div>
            <ButtonLink href={routes.home} fullWidth>
              홈으로 이동
            </ButtonLink>
          </CardContent>
        </Card>
      </main>
    );
  }

  return children;
};
