"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/providers/locale-provider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error("Page error", { name: error.name, digest: error.digest });
  }, [error]);

  return (
    <section className="page-shell text-center">
      <h1 className="text-3xl font-black">{t("errors.title")}</h1>
      <button className="button button-primary mt-6" onClick={reset}>{t("common.retry")}</button>
    </section>
  );
}
