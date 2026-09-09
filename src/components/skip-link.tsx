"use client";

import { useLocale } from "@/components/providers/locale-provider";

export function SkipLink() {
  const { t } = useLocale();
  return (
    <a
      href="#main-content"
      className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
    >
      {t("common.skipToContent")}
    </a>
  );
}
