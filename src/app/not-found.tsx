"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";

export default function NotFoundPage() {
  const { t } = useLocale();
  return (
    <section className="page-shell text-center">
      <h1 className="text-3xl font-black">{t("errors.notFound")}</h1>
      <Link className="button button-primary mt-6" href="/">{t("nav.home")}</Link>
    </section>
  );
}
