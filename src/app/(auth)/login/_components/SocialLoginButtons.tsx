import Image from "next/image";
import { showToast } from "@/shared/providers/ToastProvider";
import { authService, type OAuthProvider } from "@/features/auth";
import {
  readLoginReturnToFromLocation,
  rememberLoginReturnTo,
} from "@/entities/user";

const socialProviders = [
  {
    id: "google",
    name: "Google",
    icon: "/images/icon-google.svg",
    className:
      "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300",
  },
  {
    id: "kakao",
    name: "Kakao",
    icon: "/images/icon-kakao.svg",
    className: "border-[#FEE500] bg-[#FEE500] hover:bg-[#F6DD00]",
  },
  {
    id: "naver",
    name: "Naver",
    icon: "/images/icon-naver.svg",
    className: "border-[#03C75A] bg-[#03C75A] hover:bg-[#02B350]",
  },
] as const;

/** 소셜 로그인 버튼. 누르면 BE OAuth 주소로 이동한다. */
export const SocialLoginButtons = ({
  onBeforeRedirect,
}: {
  /** 이동하기 전에 폼 안내 문구를 지운다. */
  onBeforeRedirect: () => void;
}) => {
  const handleSocialLogin = (provider: OAuthProvider) => {
    onBeforeRedirect();
    // 소셜 로그인은 BE를 거쳐 /oauth/callback으로 돌아오므로, 돌아갈 화면을 미리 보관해 둔다.
    rememberLoginReturnTo(readLoginReturnToFromLocation());
    try {
      window.location.assign(authService.createOAuthAuthorizationUrl(provider));
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "소셜 로그인을 시작하지 못했습니다.",
      );
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-4">
        {socialProviders.map((provider) => (
          <button
            key={provider.name}
            aria-label={`${provider.name}로 계속하기`}
            title={`${provider.name}로 계속하기`}
            type="button"
            onClick={() => handleSocialLogin(provider.id)}
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
    </>
  );
};
