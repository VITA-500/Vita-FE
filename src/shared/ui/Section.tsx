import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type SectionShellProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export const SectionShell = ({ children, className, id }: SectionShellProps) => (
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
  <div className={cn("max-w-3xl", className)}>
    {label && <p className="text-lg font-extrabold text-brand">{label}</p>}

    <h2 className="mt-6 whitespace-pre-line text-4xl font-extrabold leading-[1.25] text-gray-950 sm:text-5xl dark:text-white">
      {title}
    </h2>

    {description && (
      <p className="mt-5 whitespace-pre-line text-lg leading-8 text-gray-500 dark:text-gray-400">
        {description}
      </p>
    )}
  </div>
);
