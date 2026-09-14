import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type SectionShellProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export const SectionShell = ({
  children,
  className,
  id,
}: SectionShellProps) => (
  <section
    id={id}
    className={cn(
      "scroll-mt-16 px-6 py-20 transition-colors sm:py-24 lg:py-28",
      className,
    )}
  >
    {children}
  </section>
);

type SectionHeadingProps = {
  label?: string;
  title: string;
  description?: string;
  className?: string;
};

export const SectionHeading = ({
  className,
  description,
  label,
  title,
}: SectionHeadingProps) => (
  <div
    className={cn(
      "mx-auto max-w-3xl text-center lg:mx-0 lg:text-left",
      className,
    )}
  >
    {label && (
      <p className="text-brand text-base font-extrabold sm:text-lg">{label}</p>
    )}

    <h2 className="mt-4 text-[34px] leading-[1.25] font-extrabold text-balance whitespace-pre-line text-gray-950 sm:mt-6 sm:text-5xl dark:text-white">
      {title}
    </h2>

    {description && (
      <p className="mt-4 text-base leading-7 whitespace-pre-line text-gray-500 sm:mt-5 sm:text-lg sm:leading-8 dark:text-gray-400">
        {description}
      </p>
    )}
  </div>
);
