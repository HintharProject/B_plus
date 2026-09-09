"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, AlertCircle } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";

type Organization = {
  id: string;
  name: string;
  type: string;
  description?: string;
  coarseLocation: { township: string; stateRegion: string };
};

export default function OrganizationsPage() {
  const { t } = useLocale();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/organizations")
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((result) => setOrganizations(result.organizations))
      .catch(() => setError(t("errors.offline")))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="section-heading">{t("nav.organizations")}</h1>
          <p className="section-sub">Verified blood donation organizations</p>
        </div>
      </div>

      {error && <p className="notice notice-warning mb-5">{error}</p>}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-3xl" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {organizations.map((org) => (
            <article
              key={org.id}
              className="card flex flex-col gap-3 p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                  <Building2 className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    {t("organization.verified")}
                  </p>
                  <h2 className="mt-0.5 truncate text-base font-black sm:text-lg">
                    {org.name}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400">
                <span className="status-chip status-active">{org.type}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {org.coarseLocation.township}, {org.coarseLocation.stateRegion}
                </span>
              </div>

              {org.description && (
                <p className="text-sm leading-6 text-stone-500 line-clamp-3">
                  {org.description}
                </p>
              )}
            </article>
          ))}

          {organizations.length === 0 && !error && (
            <div className="empty-state sm:col-span-2">
              <span className="grid h-14 w-14 place-items-center rounded-3xl bg-stone-50">
                <AlertCircle className="h-6 w-6 text-stone-300" aria-hidden />
              </span>
              <p className="font-bold text-stone-500">No organizations yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
