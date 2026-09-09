"use client";

import { useLocale } from "@/components/providers/locale-provider";

export function LoadingFallback() {
  const { t } = useLocale();
  return (
    <div className="page-shell animate-pulse" aria-label={t("common.loading")}>
      <div className="skeleton mb-4 h-8 w-48 rounded-2xl" />
      <div className="skeleton mb-6 h-4 w-72 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
