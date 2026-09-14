"use client";

import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  Check,
  MapPin,
  MessageCircle,
  Search,
  Store,
} from "lucide-react";
import { uiText } from "@/shared/constants/uiText";
import MotionReveal from "@/shared/ui/MotionReveal";
import { SectionHeading } from "@/shared/ui/Section";

const featureIcons = [BookOpenText, BarChart3, MapPin];
const stepIcons = [MessageCircle, Search, Check, Store];

const HomeFeatureSection = () => {
  const t = uiText;

  return (
    <section className="bg-app-bg transition-colors dark:bg-zinc-950">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-20 sm:gap-14 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-28">
        <MotionReveal>
          <div className="bg-surface-warm relative mx-auto aspect-[1932/889] w-full max-w-[620px] overflow-hidden rounded-[22px] sm:rounded-[28px]">
            <Image
              src="/images/store-map-preview.webp"
              alt="VITA 매장 지도 화면"
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-contain"
            />
          </div>
        </MotionReveal>

        <MotionReveal delay={0.12}>
          <SectionHeading
            label={t.home.mapLabel}
            title={t.home.mapTitle}
            description={t.home.mapDescription}
          />
        </MotionReveal>
      </div>

      <div className="bg-white px-5 py-20 transition-colors sm:px-6 sm:py-24 lg:py-28 dark:bg-black">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 sm:gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <MotionReveal>
            <SectionHeading
              label={t.home.recommendLabel}
              title={t.home.recommendTitle}
              description={t.home.recommendDescription}
            />
          </MotionReveal>

          <MotionReveal delay={0.12}>
            <div className="relative mx-auto aspect-[1536/1024] w-full max-w-[680px] overflow-hidden rounded-[24px] bg-white sm:rounded-[32px] dark:bg-black">
              <Image
                src="/images/recommend-plan-preview.webp"
                alt="VITA 요금제 추천 비교 화면"
                fill
                sizes="(min-width: 1024px) 56vw, 100vw"
                className="object-contain"
              />
            </div>
          </MotionReveal>
        </div>
      </div>

      <div
        id="features"
        className="bg-surface-warm scroll-mt-16 px-5 py-20 sm:px-6 sm:py-24 lg:py-28"
      >
        <div className="mx-auto max-w-[1200px]">
          <MotionReveal>
            <SectionHeading
              label={t.home.featureLabel}
              title={t.home.featureTitle}
              description={t.home.featureDescription}
            />
          </MotionReveal>

          <div className="mt-12 grid gap-10 sm:mt-16 md:grid-cols-3 lg:mt-20 lg:gap-12">
            {t.home.features.map((feature, index) => {
              const Icon = featureIcons[index];

              return (
                <div key={feature.title} className="text-center md:text-left">
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm sm:mb-8 sm:h-16 sm:w-16 md:mx-0">
                    <Icon size={30} strokeWidth={2.4} className="text-brand" />
                  </div>

                  <h3 className="text-2xl font-extrabold text-gray-950">
                    {feature.title}
                  </h3>

                  <p className="mx-auto mt-4 max-w-sm text-base leading-7 text-gray-500 sm:mt-5 md:mx-0">
                    {feature.description}
                  </p>

                  <span className="text-brand mt-6 inline-flex items-center gap-2 text-sm font-bold sm:mt-10">
                    자세히 보기
                    <ArrowRight size={16} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        id="service-flow"
        className="scroll-mt-16 bg-white px-5 py-20 transition-colors sm:px-6 sm:py-24 lg:py-28 dark:bg-black"
      >
        <MotionReveal>
          <div className="mx-auto max-w-[1200px]">
            <SectionHeading
              title={t.home.stepsTitle}
              description={t.home.stepsDescription}
            />

            <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-4 lg:mt-16">
              {t.home.steps.map((step, index) => {
                const Icon = stepIcons[index];

                return (
                  <div
                    key={step.title}
                    className="border-border-soft relative rounded-[20px] border bg-white p-5 text-center sm:rounded-[24px] sm:p-6 md:text-left dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="bg-brand-soft text-brand mx-auto flex h-11 w-11 items-center justify-center rounded-full md:mx-0">
                      <Icon size={21} />
                    </div>

                    <p className="mt-5 text-lg font-extrabold text-gray-950 sm:mt-7 dark:text-white">
                      {step.title}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      {step.description}
                    </p>

                    <span className="absolute top-6 right-6 text-sm font-extrabold text-gray-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
};

export default HomeFeatureSection;
