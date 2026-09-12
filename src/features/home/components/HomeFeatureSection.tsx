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
import { uiText } from "@/constants/uiText";
import MotionReveal from "@/common/MotionReveal";
import { SectionHeading } from "@/shared/ui/Section";

const featureIcons = [BookOpenText, BarChart3, MapPin];
const stepIcons = [MessageCircle, Search, Check, Store];

const HomeFeatureSection = () => {
  const t = uiText;

  return (
    <section className="bg-app-bg transition-colors dark:bg-zinc-950">
      <div className="mx-auto grid max-w-[1200px] items-center gap-16 px-6 py-28 lg:grid-cols-[1.08fr_0.92fr]">
        <MotionReveal>
          <div className="relative mx-auto aspect-[1932/889] w-full max-w-[620px] overflow-hidden rounded-[28px] bg-surface-warm">
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

      <div className="bg-white px-6 py-28 transition-colors dark:bg-black">
        <div className="mx-auto grid max-w-[1200px] items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <MotionReveal>
            <SectionHeading
              label={t.home.recommendLabel}
              title={t.home.recommendTitle}
              description={t.home.recommendDescription}
            />
          </MotionReveal>

          <MotionReveal delay={0.12}>
            <div className="relative mx-auto aspect-[1536/1024] w-full max-w-[680px] overflow-hidden rounded-[32px] bg-white dark:bg-black">
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

      <div id="features" className="scroll-mt-16 bg-surface-warm px-6 py-28">
        <div className="mx-auto max-w-[1200px]">
          <MotionReveal>
            <SectionHeading
              label={t.home.featureLabel}
              title={t.home.featureTitle}
              description={t.home.featureDescription}
            />
          </MotionReveal>

          <div className="mt-20 grid gap-12 md:grid-cols-3">
            {t.home.features.map((feature, index) => {
              const Icon = featureIcons[index];

              return (
                <div key={feature.title}>
                  <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Icon
                      size={30}
                      strokeWidth={2.4}
                      className="text-brand"
                    />
                  </div>

                  <h3 className="text-2xl font-extrabold text-gray-950">
                    {feature.title}
                  </h3>

                  <p className="mt-5 max-w-sm text-base leading-7 text-gray-500">
                    {feature.description}
                  </p>

                  <span className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-brand">
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
        className="scroll-mt-16 bg-white px-6 py-28 transition-colors dark:bg-black"
      >
        <MotionReveal>
          <div className="mx-auto max-w-[1200px]">
            <SectionHeading
              title={t.home.stepsTitle}
              description={t.home.stepsDescription}
            />

            <div className="mt-16 grid gap-6 md:grid-cols-4">
              {t.home.steps.map((step, index) => {
                const Icon = stepIcons[index];

                return (
                  <div
                    key={step.title}
                    className="relative rounded-[24px] border border-border-soft bg-white p-6 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <Icon size={21} />
                    </div>

                    <p className="mt-7 text-lg font-extrabold text-gray-950 dark:text-white">
                      {step.title}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      {step.description}
                    </p>

                    <span className="absolute right-6 top-6 text-sm font-extrabold text-gray-300">
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
