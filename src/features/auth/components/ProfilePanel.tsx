"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { authService } from "@/features/auth/lib/authService";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { ApiError } from "@/shared/api/http";
import { routes } from "@/shared/constants/routes";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/TextField";
import { showToast } from "@/shared/ui/ToastProvider";
import { UserAvatar } from "@/shared/ui/UserAvatar";

const providerLabels: Record<string, string> = {
  GOOGLE: "Google",
  KAKAO: "Kakao",
  LOCAL: "이메일",
  NAVER: "Naver",
};

const formatProvider = (provider: string) =>
  providerLabels[provider.toUpperCase()] ?? provider;

export const ProfilePanel = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, isReady, refreshUser, user } =
    useAuthUser();

  useEffect(() => {
    if (isReady && !isLoading && !isAuthenticated) {
      router.replace(routes.chat);
    }
  }, [isAuthenticated, isLoading, isReady, router]);

  if (!isReady || isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-gray-950 dark:text-white">
        <div className="flex items-center gap-3 text-sm font-bold text-gray-500 dark:text-gray-400">
          <Loader2 className="animate-spin" size={20} />
          프로필을 불러오는 중
        </div>
      </div>
    );
  }

  return (
    <ProfilePanelContent
      key={user.userId}
      user={user}
      onRefreshUser={refreshUser}
    />
  );
};

type ProfilePanelContentProps = {
  onRefreshUser: (force?: boolean) => Promise<void>;
  user: NonNullable<ReturnType<typeof useAuthUser>["user"]>;
};

const ProfilePanelContent = ({
  onRefreshUser,
  user,
}: ProfilePanelContentProps) => {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const linkedProviders = useMemo(
    () =>
      user.linkedProviders?.length
        ? user.linkedProviders.map(formatProvider).join(", ")
        : user.hasPassword
          ? "이메일"
          : "연동 없음",
    [user.hasPassword, user.linkedProviders],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setFeedbackMessage("");

    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      setErrorMessage("이름을 입력해주세요.");
      return;
    }

    if (trimmedPassword && trimmedPassword.length < 8) {
      setErrorMessage("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    const request = {
      ...(trimmedName !== user.name ? { name: trimmedName } : {}),
      ...(trimmedPassword ? { password: trimmedPassword } : {}),
    };

    if (!request.name && !request.password) {
      setFeedbackMessage("변경된 내용이 없습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.updateMe(request);
      setPassword("");
      await onRefreshUser(true);
      setFeedbackMessage("프로필이 저장되었습니다.");
      showToast("프로필이 저장되었습니다.");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "프로필 저장 중 문제가 발생했습니다.";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-5 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-[900px]">
        <section className="text-center">
          <div className="flex justify-center">
            <UserAvatar
              size="lg"
              className="shadow-[0_14px_32px_rgba(253,182,29,0.28)]"
            />
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
            {user.name}
          </h1>

          <div className="mx-auto mt-7 grid max-w-[780px] overflow-hidden rounded-[22px] border border-gray-200 bg-white/80 shadow-[0_14px_44px_rgba(25,31,40,0.08)] sm:grid-cols-3 dark:border-white/10 dark:bg-zinc-950/80">
            <div className="border-b border-gray-200 px-5 py-4 text-left sm:border-r sm:border-b-0 dark:border-white/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-400">
                <Mail size={15} />
                이메일
              </div>
              <p className="truncate text-sm font-extrabold">
                {user.email ?? "소셜 계정"}
              </p>
            </div>

            <div className="border-b border-gray-200 px-5 py-4 text-left sm:border-r sm:border-b-0 dark:border-white/10">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-400">
                <BadgeCheck size={15} />
                연동 방식
              </div>
              <p className="truncate text-sm font-extrabold">
                {linkedProviders}
              </p>
            </div>

            <div className="px-5 py-4 text-left">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-gray-400">
                <ShieldCheck size={15} />
                권한
              </div>
              <p className="truncate text-sm font-extrabold">{user.role}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-9 max-w-[680px]">
          <div className="mb-4">
            <h2 className="text-lg font-extrabold tracking-tight">
              계정 정보 수정
            </h2>
            <p className="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
              이름과 비밀번호를 변경할 수 있습니다.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <TextField
              label="이름"
              value={name}
              onChange={(event) => setName(event.target.value)}
              icon={<UserRound size={19} />}
              maxLength={100}
              placeholder="이름을 입력하세요"
            />

            <TextField
              label="새 비밀번호"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              icon={<KeyRound size={19} />}
              type="password"
              minLength={8}
              placeholder={
                user.hasPassword
                  ? "변경할 때만 입력하세요"
                  : "소셜 전용 계정은 변경할 수 없어요"
              }
              disabled={!user.hasPassword}
            />

            {(errorMessage || feedbackMessage) && (
              <p
                className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                  errorMessage
                    ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                }`}
                role="status"
              >
                {errorMessage || feedbackMessage}
              </p>
            )}

            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setName(user.name);
                  setPassword("");
                  setErrorMessage("");
                  setFeedbackMessage("");
                }}
              >
                입력 초기화
              </Button>

              <Button type="submit" isLoading={isSubmitting}>
                저장하기
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
