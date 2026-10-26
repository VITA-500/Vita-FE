import { routes } from "@/shared/constants/routes";
import {
  readStorage,
  removeStorage,
  writeStorage,
} from "@/shared/lib/browserStorage";

/**
 * 로그인 후 돌아갈 화면.
 * - 이메일 로그인: 로그인 주소의 `returnTo` 값으로 바로 돌아간다.
 * - 소셜 로그인: BE OAuth 흐름(`/oauth2/authorization/{provider}` → `/oauth/callback`)에는
 *   돌아갈 주소를 넘길 자리가 없어서, 떠나기 전에 sessionStorage에 잠깐 보관했다가 콜백에서 꺼낸다.
 */
const LOGIN_RETURN_STORAGE_KEY = "vita-login-return-to";
export const LOGIN_RETURN_PARAM = "returnTo";

/** 같은 사이트 안의 경로만 허용한다(외부 주소로 보내는 open redirect 방지). */
export const sanitizeLoginReturnTo = (value: string | null | undefined) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (
    value.includes("\\") ||
    /[\u0000-\u0020]/.test(value) ||
    value.startsWith(routes.login) ||
    value.startsWith(routes.oauthCallback)
  ) {
    return null;
  }

  return value;
};

/** 로그인 화면 주소. 돌아갈 화면이 있으면 `?returnTo=`로 붙인다. */
export const buildLoginHref = (returnTo?: string | null) => {
  const safeReturnTo = sanitizeLoginReturnTo(returnTo);

  return safeReturnTo
    ? `${routes.login}?${LOGIN_RETURN_PARAM}=${encodeURIComponent(safeReturnTo)}`
    : routes.login;
};

/** 지금 로그인 화면 주소에 붙은 돌아갈 화면(없거나 허용하지 않는 값이면 null). */
export const readLoginReturnToFromLocation = () => {
  try {
    return sanitizeLoginReturnTo(
      new URLSearchParams(window.location.search).get(LOGIN_RETURN_PARAM),
    );
  } catch {
    return null;
  }
};

/** 소셜 로그인으로 떠나기 전에 돌아갈 화면을 보관한다(없으면 지운다). */
export const rememberLoginReturnTo = (returnTo: string | null) => {
  // 저장소를 쓸 수 없으면 로그인 후 기본 화면으로 간다.
  if (returnTo) {
    writeStorage("session", LOGIN_RETURN_STORAGE_KEY, returnTo);
  } else {
    removeStorage("session", LOGIN_RETURN_STORAGE_KEY);
  }
};

/** 소셜 로그인 콜백에서 보관해 둔 돌아갈 화면을 꺼내고 지운다. */
export const takeRememberedLoginReturnTo = () => {
  const value = readStorage("session", LOGIN_RETURN_STORAGE_KEY);

  removeStorage("session", LOGIN_RETURN_STORAGE_KEY);
  return sanitizeLoginReturnTo(value);
};
