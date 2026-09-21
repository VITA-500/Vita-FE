const AUTH_HINT_COOKIE = "vita_has_access_token";

const setAuthHintCookie = () => {
  document.cookie = `${AUTH_HINT_COOKIE}=1; path=/; max-age=2592000; SameSite=Lax`;
};

const removeAuthHintCookie = () => {
  document.cookie = `${AUTH_HINT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
};

export const tokenStorage = {
  hasAccessTokenHint: () => {
    if (typeof window === "undefined") {
      return false;
    }

    return document.cookie
      .split("; ")
      .some((cookie) => cookie === `${AUTH_HINT_COOKIE}=1`);
  },
  removeAuthHint: () => {
    if (typeof window === "undefined") {
      return;
    }

    removeAuthHintCookie();
  },
  setAuthHint: () => {
    if (typeof window === "undefined") {
      return;
    }

    setAuthHintCookie();
  },
};
