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
    const accessToken = tokenStorage.getAccessToken();

    if (!accessToken) {
      return null;
    }

    try {
      return await authService.getMe();
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        tokenStorage.removeAccessToken();
      }

      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const nextHasAccessToken = Boolean(tokenStorage.getAccessToken());

    setHasAccessToken(nextHasAccessToken);
    setIsLoading(nextHasAccessToken);

    try {
      const nextUser = await loadUser();

      setUser(nextUser);
    } finally {
      setHasAccessToken(Boolean(tokenStorage.getAccessToken()));
      setIsLoading(false);
    }
  }, [loadUser]);

  const logout = useCallback(() => {
    tokenStorage.removeAccessToken();
    setUser(null);
    window.dispatchEvent(new Event("vita-auth-changed"));
  }, []);

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setHasAccessToken(
        Boolean(tokenStorage.getAccessToken()) ||
          tokenStorage.hasAccessTokenHint(),
      );
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialUser = async () => {
      const nextHasAccessToken = Boolean(tokenStorage.getAccessToken());

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
      setHasAccessToken(Boolean(tokenStorage.getAccessToken()));
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
