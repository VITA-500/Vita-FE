"use client";

import { ArrowRight } from "lucide-react";
import { uiText } from "@/constants/uiText";
import MotionReveal from "@/common/MotionReveal";
import { routes } from "@/shared/constants/routes";
import { ButtonLink } from "@/shared/ui/Button";

const HomeCtaSection = () => {
  const t = uiText;
  const [titleLead, titleHighlight] = t.home.ctaTitle.split("\n");

  return (
    <section className="bg-surface-warm px-6 py-20 text-gray-950 dark:text-white">
      <MotionReveal>
        <div className="mx-auto flex max-w-[1200px] flex-col items-center text-center">
          <h2 className="text-4xl font-extrabold leading-[1.25] sm:text-5xl">
            <span className="block">{titleLead}</span>
            <span className="block text-brand">{titleHighlight}</span>
          </h2>

          <ButtonLink
            href={routes.login}
            size="lg"
            className="mt-10 inline-flex h-14 items-center justify-center gap-3 rounded-2xl px-8 text-base font-bold shadow-xl shadow-brand/25"
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
