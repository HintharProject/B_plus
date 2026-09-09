"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LoadingFallback } from "@/components/loading-fallback";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";

function ReportForm() {
  const search = useSearchParams();
  const { t } = useLocale();
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await apiRequest("/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType: search.get("targetType") ?? "USER",
          targetId: search.get("targetId") ?? data.get("targetId"),
          reason: data.get("reason"),
          details: data.get("details"),
        }),
      });
      form.reset();
      setStatus(t("report.submitted"));
    } catch {
      setStatus(t("errors.offline"));
    }
  }

  return (
    <section className="page-shell">
      <form className="card mx-auto max-w-xl space-y-5 p-6" onSubmit={submit}>
        <h1 className="text-2xl font-black">{t("chat.report")}</h1>
        {!search.get("targetId") ? <label className="label">{t("report.targetId")}<input className="field" name="targetId" required /></label> : null}
        <label className="label">{t("report.reason")}
          <select className="field" name="reason">
            <option value="SPAM">{t("report.spam")}</option>
            <option value="HARASSMENT">{t("report.harassment")}</option>
            <option value="FAKE_REQUEST">{t("report.fakeRequest")}</option>
            <option value="PRIVACY">{t("report.privacy")}</option>
            <option value="OTHER">{t("report.other")}</option>
          </select>
        </label>
        <label className="label">{t("report.details")}<textarea className="field" name="details" maxLength={1000} /></label>
        {status ? <p className="notice notice-info">{status}</p> : null}
        <button className="button button-primary w-full">{t("common.save")}</button>
      </form>
    </section>
  );
}

export default function ReportPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<LoadingFallback />}>
        <ReportForm />
      </Suspense>
    </AuthGuard>
  );
}
