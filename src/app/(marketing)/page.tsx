import HeroSection from "@/features/home/components/HeroSection";
import HomeCtaSection from "@/features/home/components/HomeCtaSection";
import HomeFeatureSection from "@/features/home/components/HomeFeatureSection";
import HomeIntroSection from "@/features/home/components/HomeIntroSection";

const Page = () => {
  return (
    <>
      <HeroSection />
      <HomeIntroSection />
      <HomeFeatureSection />
      <HomeCtaSection />
    </>
  );
};

export default Page;
