"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { uiText } from "@/constants/uiText";
import { routes } from "@/shared/constants/routes";
import { Logo } from "@/shared/ui/Logo";

const isExternalLink = (href: string) => {
  return href.startsWith("http") || href.startsWith("mailto:");
};

const Footer = () => {
  const t = uiText;
  const pathname = usePathname();

  if (pathname === routes.login) {
    return null;
  }

  return (
    <footer className="border-t border-gray-200 bg-gray-50 px-6 py-14 transition-colors dark:border-white/10 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12">
          <Logo href={routes.home} heightClassName="h-12" alt={`${t.common.title} 로고`} />

          <p className="mt-5 max-w-4xl text-sm leading-7 text-gray-500 dark:text-gray-400">
            {t.footer.description}
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {t.footer.columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-white">
                {column.title}
              </h3>

              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    {isExternalLink(link.href) ? (
                      <a
                        href={link.href}
                        target={
                          link.href.startsWith("http") ? "_blank" : undefined
                        }
                        rel={
                          link.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="text-sm font-medium text-gray-500 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-gray-500 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-gray-200 pt-8 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-gray-400">
            {t.footer.copyright}
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/orgs/VITA-500/repositories"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-gray-300 hover:text-gray-950 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20 dark:hover:text-white"
            >
              <FaGithub size={19} />
            </a>

            <a
              href="mailto:example@example.com"
              aria-label="Email"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-gray-300 hover:text-gray-950 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20 dark:hover:text-white"
            >
              <Mail size={19} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
