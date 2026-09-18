"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
};

const THEME_STORAGE_KEY = "vita_theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [resolvedTheme, setResolvedTheme] = useState<Theme>("light");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const initialTheme = getInitialTheme();

      setResolvedTheme(initialTheme);
      applyTheme(initialTheme);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    setResolvedTheme(theme);
    applyTheme(theme);
  }, []);

  const value = useMemo(
    () => ({
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
};
