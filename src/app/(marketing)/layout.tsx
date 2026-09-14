import Footer from "@/shared/layout/Footer";
import Header from "@/shared/layout/Header";
import ScrollTopButton from "@/shared/layout/ScrollTopButton";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors dark:bg-black">
      <Header />

      <main className="flex-1">{children}</main>

      <Footer />

      <ScrollTopButton />
    </div>
  );
}
