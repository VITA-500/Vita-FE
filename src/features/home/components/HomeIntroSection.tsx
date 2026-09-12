"use client";

import Image from "next/image";
import MotionReveal from "@/common/MotionReveal";
import { uiText } from "@/constants/uiText";
import { SectionHeading } from "@/shared/ui/Section";

const HomeIntroSection = () => {
  const t = uiText;

  return (
    <section
      id="service-intro"
      className="scroll-mt-16 bg-background px-6 py-28 transition-colors dark:bg-black"
    >
      <div className="mx-auto grid max-w-[1200px] items-center gap-16 lg:grid-cols-[0.86fr_1fr]">
        <MotionReveal>
          <SectionHeading
            label={t.home.introLabel}
            title={t.home.introTitle}
            description={t.home.introDescription}
          />
        </MotionReveal>

        <MotionReveal delay={0.12}>
          <div className="relative mx-auto aspect-[1448/1086] w-full max-w-[620px] overflow-hidden rounded-[32px]">
            <Image
              src="/images/intro-chat-preview.webp"
              alt="VITA FAQ 기반 답변 화면"
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
          </div>
        </MotionReveal>
      </div>
    </section>
  );
};

export default HomeIntroSection;
