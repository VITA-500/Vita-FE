"use client";

import { ArrowRight } from "lucide-react";
import { uiText } from "@/shared/constants/uiText";
import MotionReveal from "@/shared/ui/MotionReveal";
import { routes } from "@/shared/constants/routes";
import { ButtonLink } from "@/shared/ui/Button";

const HomeCtaSection = () => {
  const t = uiText;
  const [titleLead, titleHighlight] = t.home.ctaTitle.split("\n");

  return (
    <section className="bg-surface-warm px-5 py-16 text-gray-950 sm:px-6 sm:py-20 dark:text-white">
      <MotionReveal>
        <div className="mx-auto flex max-w-[1200px] flex-col items-center text-center">
          <h2 className="text-[30px] font-extrabold leading-[1.22] sm:text-5xl sm:leading-[1.25]">
            <span className="block">{titleLead}</span>
            <span className="block whitespace-nowrap text-brand">
              {titleHighlight}
            </span>
          </h2>

          <ButtonLink
            href={routes.login}
            size="lg"
            className="mt-8 inline-flex h-[52px] items-center justify-center gap-3 rounded-2xl px-7 text-base font-bold shadow-xl shadow-brand/25 sm:mt-10 sm:h-14 sm:px-8"
          >
            {t.home.ctaButton}
            <ArrowRight size={20} />
          </ButtonLink>
        </div>
      </MotionReveal>
    </section>
  );
};

export default HomeCtaSection;
