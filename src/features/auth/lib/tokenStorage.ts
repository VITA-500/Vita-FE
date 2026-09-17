"use client";

const ACCESS_TOKEN_KEY = "vita_access_token";
const AUTH_HINT_COOKIE = "vita_has_access_token";

const setAuthHintCookie = () => {
  document.cookie = `${AUTH_HINT_COOKIE}=1; path=/; max-age=2592000; SameSite=Lax`;
};

const removeAuthHintCookie = () => {
  document.cookie = `${AUTH_HINT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
};

export const tokenStorage = {
  getAccessToken: () => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  hasAccessTokenHint: () => {
    if (typeof window === "undefined") {
      return false;
    }

    return document.cookie
      .split("; ")
      .some((cookie) => cookie === `${AUTH_HINT_COOKIE}=1`);
  },
  removeAccessToken: () => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    removeAuthHintCookie();
  },
  setAccessToken: (token: string) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setAuthHintCookie();
  },
};
