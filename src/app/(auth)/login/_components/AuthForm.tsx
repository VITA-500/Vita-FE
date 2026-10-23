import { LockKeyhole, Mail, UserRound } from "lucide-react";
import type { AuthFormState } from "../_hooks/useAuthForm";
import { Button } from "@/shared/ui/atoms/Button";
import { TextField } from "@/shared/ui/atoms/TextField";

/** 로그인·회원가입 입력칸, 결과 안내, 제출 버튼 */
export const AuthForm = ({ form }: { form: AuthFormState }) => (
  <form className="mt-8 space-y-4" onSubmit={form.submit}>
    {!form.isLogin && (
      <TextField
        label="이름"
        value={form.name}
        onChange={(event) => form.setName(event.target.value)}
        type="text"
        autoComplete="name"
        placeholder="이름을 입력하세요"
        icon={<UserRound size={19} />}
      />
    )}

    <TextField
      label="이메일"
      value={form.email}
      onChange={(event) => form.setEmail(event.target.value)}
      type="email"
      autoComplete="username"
      placeholder="이메일을 입력하세요"
      icon={<Mail size={19} />}
    />

    <TextField
      label="비밀번호"
      value={form.password}
      onChange={(event) => form.setPassword(event.target.value)}
      type="password"
      autoComplete={form.isLogin ? "current-password" : "new-password"}
      placeholder="비밀번호를 입력하세요"
      icon={<LockKeyhole size={19} />}
    />

    {!form.isLogin && (
      <TextField
        label="비밀번호 확인"
        value={form.passwordConfirm}
        onChange={(event) => form.setPasswordConfirm(event.target.value)}
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호를 한 번 더 입력하세요"
        icon={<LockKeyhole size={19} />}
      />
    )}

    {(form.errorMessage || form.successMessage) && (
      <p
        className={`rounded-2xl px-4 py-3 text-sm font-bold ${
          form.errorMessage
            ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        }`}
        role="status"
      >
        {form.errorMessage || form.successMessage}
      </p>
    )}

    {/* 로그인 / 회원가입 버튼 */}
    <Button
      type="submit"
      disabled={form.isSubmitting}
      size="lg"
      className="shadow-brand/20 mt-2 w-full shadow-lg"
    >
      {form.isSubmitting ? "처리 중..." : form.isLogin ? "로그인" : "회원가입"}
    </Button>
  </form>
);
