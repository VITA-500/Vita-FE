"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { authService } from "@/features/auth/lib/authService";
import { tokenStorage } from "@/features/auth/lib/tokenStorage";
import { ApiError } from "@/shared/api/http";
import type { MyPageResponse } from "@/features/auth/types";

type UseAuthUserOptions = {
  initialHasAccessToken?: boolean;
};

export const useAuthUser = ({
  initialHasAccessToken = false,
}: UseAuthUserOptions = {}) => {
  const [hasAccessToken, setHasAccessToken] = useState(initialHasAccessToken);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<MyPageResponse | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const nextUser = await authService.getMe();

      tokenStorage.setAuthHint();
      return nextUser;
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        tokenStorage.removeAuthHint();
      }

      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const nextHasAccessToken =
      initialHasAccessToken || tokenStorage.hasAccessTokenHint();

    setHasAccessToken(nextHasAccessToken);
    setIsLoading(nextHasAccessToken);

    try {
      const nextUser = await loadUser();

      setUser(nextUser);
    } finally {
      setHasAccessToken(tokenStorage.hasAccessTokenHint());
      setIsLoading(false);
    }
  }, [initialHasAccessToken, loadUser]);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => undefined);
    tokenStorage.removeAuthHint();
    setUser(null);
    window.dispatchEvent(new Event("vita-auth-changed"));
  }, []);

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setHasAccessToken(tokenStorage.hasAccessTokenHint());
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialUser = async () => {
      const nextHasAccessToken =
        initialHasAccessToken || tokenStorage.hasAccessTokenHint();

      if (!isMounted) {
        return;
      }

      setHasAccessToken(nextHasAccessToken);

      if (!nextHasAccessToken) {
        setIsLoading(false);
        return;
      }

      const nextUser = await loadUser();

      if (!isMounted) {
        return;
      }

      setUser(nextUser);
      setHasAccessToken(tokenStorage.hasAccessTokenHint());
      setIsLoading(false);
    };

    void loadInitialUser();

    window.addEventListener("storage", refreshUser);
    window.addEventListener("vita-auth-changed", refreshUser);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", refreshUser);
      window.removeEventListener("vita-auth-changed", refreshUser);
    };
  }, [loadUser, refreshUser]);

  return {
    hasAccessToken,
    isAuthenticated: Boolean(user),
    isLoading,
    logout,
    user,
  };
};
