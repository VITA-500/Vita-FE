"use client";

import { ThemeProvider } from "@/shared/ui/ThemeProvider";
import { ToastProvider } from "@/shared/ui/ToastProvider";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      {children}
      <ToastProvider />
    </ThemeProvider>
  );
};

export default Providers;
