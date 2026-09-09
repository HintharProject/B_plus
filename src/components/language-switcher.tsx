"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return (
    <label className="flex items-center gap-1.5 text-xs font-bold text-stone-600">
      <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="sr-only">{t("common.language")}</span>
      <select
        className="min-h-[36px] cursor-pointer rounded-lg border border-stone-200 bg-white py-1.5 pl-2 pr-6 text-xs font-semibold text-stone-700 outline-none transition hover:border-brand-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        value={locale}
        onChange={(event) => setLocale(event.target.value as "my" | "en")}
        aria-label={t("common.language")}
      >
        <option value="my">မြန်မာ</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
