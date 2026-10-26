"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authService } from "@/features/auth";
import { readLoginReturnToFromLocation, tokenStorage } from "@/entities/user";
import { ApiError } from "@/shared/api/http";
import { routes } from "@/shared/constants/routes";
import { showToast } from "@/shared/providers/ToastProvider";

export type AuthMode = "login" | "signup";

/** 로그인·회원가입 폼 상태와 제출. 화면 표시는 AuthForm이 맡는다. */
export const useAuthForm = () => {
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

  const toggleMode = () => {
    resetFeedback();
    setMode(isLogin ? "signup" : "login");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
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

        await authService.getMe();
        tokenStorage.setAuthHint();
        window.dispatchEvent(new Event("vita-auth-changed"));
        showToast("로그인되었습니다.");
        // 지도에서 예약하려다 로그인한 경우 등, 들어오기 전 화면으로 돌아간다.
        router.push(readLoginReturnToFromLocation() ?? routes.chat);
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
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      )
        tokenStorage.removeAuthHint();
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "요청 처리 중 문제가 발생했습니다.";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    errorMessage,
    isLogin,
    isSubmitting,
    name,
    password,
    passwordConfirm,
    resetFeedback,
    setEmail,
    setName,
    setPassword,
    setPasswordConfirm,
    submit,
    successMessage,
    toggleMode,
  };
};

export type AuthFormState = ReturnType<typeof useAuthForm>;
