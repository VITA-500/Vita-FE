import { cookies } from "next/headers";
import Footer from "@/shared/layout/Footer";
import Header from "@/shared/layout/Header";
import ScrollTopButton from "@/shared/layout/ScrollTopButton";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialHasAccessToken =
    cookieStore.get("vita_has_access_token")?.value === "1";

  return (
    <div className="bg-background flex min-h-screen flex-col transition-colors dark:bg-black">
      <Header initialHasAccessToken={initialHasAccessToken} />

      <main className="flex-1">{children}</main>

      <Footer />

      <ScrollTopButton />
    </div>
  );
}
