"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { authService } from "@/features/auth/lib/authService";
import { tokenStorage } from "@/features/auth/lib/tokenStorage";
import type { MyPageResponse } from "@/features/auth/types";
import { ApiError } from "@/shared/api/http";

type UseAuthUserOptions = {
  initialHasAccessToken?: boolean;
};

type AuthContextValue = {
  hasAccessToken: boolean;
  isAuthenticated: boolean;
  isReady: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: (forceRequest?: boolean) => Promise<void>;
  user: MyPageResponse | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getInitialHasAccessToken = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return tokenStorage.hasAccessTokenHint();
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [hasAccessToken, setHasAccessToken] = useState(
    getInitialHasAccessToken,
  );
  const [isLoading, setIsLoading] = useState(getInitialHasAccessToken);
  const [isReady, setIsReady] = useState(false);
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

  const refreshUser = useCallback(
    async (forceRequest = false) => {
      const nextHasAccessToken =
        forceRequest || tokenStorage.hasAccessTokenHint();

      setHasAccessToken(nextHasAccessToken);

      if (!nextHasAccessToken) {
        setUser(null);
        setIsLoading(false);
        setIsReady(true);
        return;
      }

      setIsLoading(true);

      try {
        const nextUser = await loadUser();

        setUser(nextUser);
      } finally {
        setHasAccessToken(tokenStorage.hasAccessTokenHint());
        setIsLoading(false);
        setIsReady(true);
      }
    },
    [loadUser],
  );

  const logout = useCallback(async () => {
    await authService.logout().catch(() => undefined);
    tokenStorage.removeAuthHint();
    setHasAccessToken(false);
    setIsReady(true);
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
    const handleAuthChange = () => {
      void refreshUser();
    };
    const frameId = window.requestAnimationFrame(() => {
      void refreshUser();
    });

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("vita-auth-changed", handleAuthChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("vita-auth-changed", handleAuthChange);
    };
  }, [refreshUser]);

  const value = useMemo(
    () => ({
      hasAccessToken,
      isAuthenticated: Boolean(user),
      isReady,
      isLoading,
      logout,
      refreshUser,
      user,
    }),
    [hasAccessToken, isLoading, isReady, logout, refreshUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthUser = ({
  initialHasAccessToken = false,
}: UseAuthUserOptions = {}) => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthUser must be used within AuthProvider.");
  }

  const {
    hasAccessToken,
    isAuthenticated,
    isLoading,
    isReady,
    refreshUser,
    user,
  } = context;

  useEffect(() => {
    if (
      !initialHasAccessToken ||
      isReady ||
      hasAccessToken ||
      isAuthenticated ||
      isLoading
    ) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      void refreshUser(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    hasAccessToken,
    initialHasAccessToken,
    isAuthenticated,
    isLoading,
    isReady,
    refreshUser,
  ]);

  return {
    ...context,
    hasAccessToken: hasAccessToken || (!isReady && initialHasAccessToken),
    isLoading: isLoading || (!isReady && initialHasAccessToken && !user),
  };
};
