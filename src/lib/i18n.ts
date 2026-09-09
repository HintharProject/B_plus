import en from "@/messages/en.json";
import my from "@/messages/my.json";

export const locales = ["my", "en"] as const;
export type Locale = (typeof locales)[number];
export type TranslationKey = `${keyof typeof en & string}.${string}`;

export const dictionaries = { en, my } as const;

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function translate(locale: Locale, key: string) {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, dictionaries[locale]);

  if (typeof value === "string") return value;

  const fallback = key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, dictionaries.en);

  return typeof fallback === "string" ? fallback : key;
}
