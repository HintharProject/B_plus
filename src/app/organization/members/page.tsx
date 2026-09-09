"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LoadingFallback } from "@/components/loading-fallback";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";

function MembersForm() {
  const organizationId = useSearchParams().get("organizationId") ?? "";
  const { t } = useLocale();
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await apiRequest(`/organizations/${organizationId}/members`, {
        method: "PUT",
        body: JSON.stringify({
          userId: data.get("userId"),
          role: data.get("role"),
        }),
      });
      setStatus(t("common.save"));
    } catch {
      setStatus(t("errors.unauthorized"));
    }
  }

  return (
    <section className="page-shell">
      <form className="card mx-auto max-w-xl space-y-5 p-6" onSubmit={submit}>
        <h1 className="text-2xl font-black">{t("organization.members")}</h1>
        <label className="label">{t("common.userId")}<input className="field" name="userId" required /></label>
        <label className="label">{t("common.roles")}
          <select className="field" name="role">
            <option value="COORDINATOR">{t("organization.coordinator")}</option>
            <option value="VIEWER">{t("organization.viewer")}</option>
            <option value="OWNER">{t("organization.owner")}</option>
          </select>
        </label>
        {status ? <p className="notice notice-info">{status}</p> : null}
        <button className="button button-primary w-full" disabled={!organizationId}>{t("common.save")}</button>
      </form>
    </section>
  );
}

export default function MembersPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<LoadingFallback />}>
        <MembersForm />
      </Suspense>
    </AuthGuard>
  );
}
