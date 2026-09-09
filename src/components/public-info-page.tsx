"use client";

import { useLocale } from "@/components/providers/locale-provider";

export function PublicInfoPage({
  titleKey,
  textKey,
}: {
  titleKey: string;
  textKey: string;
}) {
  const { t } = useLocale();
  return (
    <div className="page-shell">
      <article className="card mx-auto max-w-3xl p-5 sm:p-10">
        <h1 className="text-2xl font-black sm:text-3xl">{t(titleKey)}</h1>
        <p className="mt-4 text-base leading-8 text-stone-600 sm:mt-5">{t(textKey)}</p>
        <p className="notice notice-info mt-5 text-xs sm:mt-6 sm:text-sm">
          {t("common.privacyNotice")}
        </p>
      </article>
    </div>
  );
}
