"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { uiText } from "@/shared/constants/uiText";
import MotionReveal from "@/shared/ui/MotionReveal";
import { TrialChatModal } from "@/features/home/components/TrialChatModal";
import { useTrialChat } from "@/features/home/hooks/useTrialChat";
import { Button } from "@/shared/ui/Button";

const HeroSection = () => {
  const t = uiText;
  const trialChat = useTrialChat();

  return (
    <section className="relative overflow-hidden bg-surface-warm px-5 py-8 sm:px-6 sm:py-12 lg:min-h-[calc(100svh-4rem)] lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border-soft" />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-8 sm:gap-10 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        <MotionReveal>
          <div className="mx-auto max-w-[640px] text-center lg:mx-0 lg:text-left">
            <p className="mx-auto mb-4 inline-flex rounded-full bg-brand-soft px-4 py-2 text-sm font-bold text-brand shadow-sm sm:mb-5 sm:px-5 lg:mx-0">
              {t.home.heroBadge}
            </p>

            <h1 className="text-[34px] font-extrabold leading-[1.12] text-gray-950 sm:text-5xl lg:text-[56px] dark:text-white">
              <span className="block">{t.home.heroTitleLead}</span>
              <span className="block whitespace-nowrap text-brand">
                {t.home.heroTitleHighlight}
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-600 sm:mt-5 sm:whitespace-pre-line sm:text-lg sm:leading-8 lg:mx-0 dark:text-gray-400">
              <span className="block sm:hidden">
                궁금한 내용을 물어보면 필요한 정보를 찾아 정리하고
                <br />
                가까운 매장까지 한 번에 안내해요.
              </span>
              <span className="hidden sm:block">{t.home.heroDescription}</span>
            </p>

            <div className="mt-7 flex flex-col items-center gap-4 sm:mt-8 sm:flex-row sm:justify-center lg:justify-start">
              <Button
                onClick={trialChat.openTrial}
                size="lg"
                className="inline-flex h-[52px] w-full max-w-[230px] items-center justify-center gap-3 rounded-2xl px-6 text-base font-bold shadow-xl shadow-brand/25 sm:h-14 sm:w-auto sm:max-w-[250px] sm:px-7"
              >
                <span>{t.home.heroButton}</span>
                <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        </MotionReveal>

        <div className="hidden lg:block">
          <MotionReveal delay={0.12}>
            <div className="hero-visual-frame relative mx-auto h-[460px] w-full max-w-[700px] overflow-hidden lg:mx-0 lg:h-[590px] lg:max-w-none">
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
