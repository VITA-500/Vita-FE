"use client";

import { AuthProvider } from "@/features/auth/hooks/useAuthUser";
import { ThemeProvider } from "@/shared/ui/ThemeProvider";
import { ToastProvider } from "@/shared/ui/ToastProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
        <ToastProvider />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default Providers;
