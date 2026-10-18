"use client";

import { AuthProvider } from "@/features/auth/hooks/useAuthUser";
import { ThemeProvider } from "@/shared/providers/ThemeProvider";
import { ToastProvider } from "@/shared/providers/ToastProvider";
import { QueryProvider } from "./query-provider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <QueryProvider>
        <ThemeProvider>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </QueryProvider>
    </AuthProvider>
  );
};

export default Providers;
