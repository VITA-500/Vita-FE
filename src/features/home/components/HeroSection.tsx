"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { uiText } from "@/constants/uiText";
import MotionReveal from "@/common/MotionReveal";
import { TrialChatModal } from "@/features/home/components/TrialChatModal";
import { useTrialChat } from "@/features/home/hooks/useTrialChat";
import { Button } from "@/shared/ui/Button";

const HeroSection = () => {
  const t = uiText;
  const trialChat = useTrialChat();

  return (
    <section className="relative overflow-hidden bg-surface-warm px-6 py-10 sm:py-12 lg:min-h-[calc(100svh-4rem)] lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border-soft" />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <MotionReveal>
          <div className="max-w-[640px]">
            <p className="mb-5 inline-flex rounded-full bg-brand-soft px-5 py-2 text-sm font-bold text-brand shadow-sm">
              {t.home.heroBadge}
            </p>

            <h1 className="text-5xl font-extrabold leading-[1.08] text-gray-950 sm:text-[56px] dark:text-white">
              <span className="block">{t.home.heroTitleLead}</span>
              <span className="block text-brand">
                {t.home.heroTitleHighlight}
              </span>
            </h1>

            <p className="mt-5 max-w-xl whitespace-pre-line text-lg leading-8 text-gray-600 dark:text-gray-400">
              {t.home.heroDescription}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                onClick={trialChat.openTrial}
                size="lg"
                className="inline-flex h-14 w-full max-w-[250px] items-center justify-center gap-3 rounded-2xl px-7 text-base font-bold shadow-xl shadow-brand/25 sm:w-auto"
              >
                <span>{t.home.heroButton}</span>
                <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.12}>
          <div className="hero-visual-frame relative mx-auto h-[440px] w-full max-w-[700px] overflow-hidden sm:h-[520px] lg:mx-0 lg:h-[590px] lg:max-w-none">
            <Image
              src="/images/hero-chat-visual.webp"
              alt="VITA AI 상담 화면"
              fill
              priority
              sizes="(min-width: 1024px) 54vw, 100vw"
              className="object-contain object-center lg:translate-x-2 lg:scale-[1.28]"
            />
          </div>
        </MotionReveal>
      </div>

      {trialChat.isTrialOpen && (
        <TrialChatModal
          inputRef={trialChat.inputRef}
          isLimitReached={trialChat.isLimitReached}
          messages={trialChat.messages}
          question={trialChat.question}
          remainingCount={trialChat.remainingCount}
          onClose={() => trialChat.setIsTrialOpen(false)}
          onQuestionChange={trialChat.setQuestion}
          onSubmit={trialChat.handleSubmit}
        />
      )}
    </section>
  );
};

export default HeroSection;
