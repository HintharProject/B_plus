"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";

type AdminOverview = {
  organizations: Array<{ id: string; name: string; type: string }>;
  reports: Array<{ id: string; targetType: string; reason: string }>;
  audit: Array<{ id: string; action: string; resourceType: string; resourceId: string }>;
};

function AdminDashboard() {
  const { t } = useLocale();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await apiRequest<AdminOverview>("/admin/overview"));
    } catch {
      setError(t("admin.restricted"));
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  async function reviewOrganization(id: string, status: "VERIFIED" | "REJECTED") {
    await apiRequest(`/admin/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function reviewReport(id: string, status: "RESOLVED" | "DISMISSED") {
    await apiRequest(`/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await load();
  }

  return (
    <section className="page-shell">
      <h1 className="text-3xl font-black">{t("admin.title")}</h1>
      {error ? <p className="notice notice-warning mt-5">{error}</p> : null}
      {data ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="card p-5">
            <h2 className="text-lg font-black">{t("admin.organizations")}</h2>
            <div className="mt-4 space-y-3">
              {data.organizations.map((organization) => (
                <article className="rounded-2xl bg-stone-50 p-4" key={organization.id}>
                  <p className="font-bold">{organization.name} · {organization.type}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="button button-primary" onClick={() => reviewOrganization(organization.id, "VERIFIED")}>{t("organization.verified")}</button>
                    <button className="button button-secondary" onClick={() => reviewOrganization(organization.id, "REJECTED")}>{t("common.cancel")}</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="card p-5">
            <h2 className="text-lg font-black">{t("admin.reports")}</h2>
            <div className="mt-4 space-y-3">
              {data.reports.map((report) => (
                <article className="rounded-2xl bg-stone-50 p-4" key={report.id}>
                  <p className="font-bold">{report.targetType} · {report.reason}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="button button-primary" onClick={() => reviewReport(report.id, "RESOLVED")}>{t("common.close")}</button>
                    <button className="button button-secondary" onClick={() => reviewReport(report.id, "DISMISSED")}>{t("common.cancel")}</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="card p-5 lg:col-span-2">
            <h2 className="text-lg font-black">{t("admin.audit")}</h2>
            <ul className="mt-4 divide-y text-sm">
              {data.audit.map((event) => <li className="py-3" key={event.id}>{event.action} · {event.resourceType} · {event.resourceId}</li>)}
            </ul>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default function AdminPage() {
  return <AuthGuard><AdminDashboard /></AuthGuard>;
}
