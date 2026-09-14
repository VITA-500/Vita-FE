import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Vita",
  description: "AI 통신 상담 지원 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-background min-h-screen text-gray-900 transition-colors dark:bg-black dark:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
