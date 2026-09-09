"use client";

import Link from "next/link";
import { Brand } from "@/components/brand";
import { useLocale } from "@/components/providers/locale-provider";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-stone-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand + notice */}
          <div className="flex flex-col gap-2.5">
            <Brand />
            <p className="max-w-xs text-xs leading-6 text-stone-400">
              {t("common.privacyNotice")}
            </p>
          </div>

          {/* Nav links — wraps on very small screens */}
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-stone-500"
            aria-label={t("nav.mainLabel")}
          >
            <Link href="/about" className="transition hover:text-brand-700">
              {t("public.aboutTitle")}
            </Link>
            <Link href="/how-it-works" className="transition hover:text-brand-700">
              {t("public.howTitle")}
            </Link>
            <Link href="/safety" className="transition hover:text-brand-700">
              {t("public.safetyTitle")}
            </Link>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 border-t border-stone-100 pt-5 text-xs text-stone-400 sm:mt-8">
          © {new Date().getFullYear()} B+ · Every type counts.
        </div>
      </div>
    </footer>
  );
}
