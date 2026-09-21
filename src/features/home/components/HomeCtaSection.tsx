"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { uiText } from "@/shared/constants/uiText";
import MotionReveal from "@/shared/ui/MotionReveal";
import { routes } from "@/shared/constants/routes";
import { Button } from "@/shared/ui/Button";

const HomeCtaSection = () => {
  const router = useRouter();
  const t = uiText;
  const [titleLead, titleHighlight] = t.home.ctaTitle.split("\n");

  return (
    <section className="bg-surface-warm px-5 py-16 text-gray-950 sm:px-6 sm:py-20 dark:text-white">
      <MotionReveal>
        <div className="mx-auto flex max-w-[1200px] flex-col items-center text-center">
          <h2 className="text-[30px] leading-[1.22] font-extrabold sm:text-5xl sm:leading-[1.25]">
            <span className="block">{titleLead}</span>
            <span className="text-brand block whitespace-nowrap">
              {titleHighlight}
            </span>
          </h2>

          <Button
            onClick={() => router.push(routes.chat)}
            size="lg"
            className="shadow-brand/25 mt-8 inline-flex h-[52px] min-w-[210px] items-center justify-center gap-3 rounded-2xl px-7 text-base font-bold shadow-xl sm:mt-10 sm:h-14 sm:px-8"
          >
            <span>{t.home.ctaButton}</span>
            <ArrowRight size={20} />
          </Button>
        </div>
      </MotionReveal>
    </section>
  );
};

export default HomeCtaSection;
