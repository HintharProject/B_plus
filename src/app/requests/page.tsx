"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Zap, AlertCircle } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { UrgencyPill } from "@/components/urgency-pill";
import type { Urgency } from "@/lib/domain";

type RequestItem = {
  id: string;
  bloodTypeNeeded: string;
  urgency: Urgency;
  hospital: string;
  status: string;
};

const STATUS_CHIP: Record<string, string> = {
  ACTIVE: "status-active",
  PENDING: "status-pending",
};

function RequestsList() {
  const { t } = useLocale();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ requests: RequestItem[] }>("/requests");
      setItems(result.requests);
    } catch {
      setStatus(t("errors.offline"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  async function generate(requestId: string) {
    try {
      const result = await apiRequest<{ created: number }>("/matches/generate", {
        method: "POST",
        body: JSON.stringify({ requestId, maximumCandidates: 10 }),
      });
      setStatus(`${t("request.matchesCreated")} ${result.created}`);
    } catch {
      setStatus(t("errors.offline"));
    }
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-heading">{t("nav.requests")}</h1>
          <p className="section-sub">Manage blood donation requests</p>
        </div>
        <Link
          className="button button-primary gap-2"
          href="/requests/new"
          id="new-request-btn"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t("dashboard.newRequest")}
        </Link>
      </div>

      {status && (
        <p className="notice notice-info mb-5" role="status">{status}</p>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Request cards */}
      {!loading && (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-3xl border border-stone-100 bg-white p-5 shadow-card transition-all duration-200 hover:border-brand-100 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                {/* Blood type badge */}
                <div className="blood-badge shrink-0 h-12 w-12 rounded-2xl text-base">
                  {item.bloodTypeNeeded}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/requests/${item.id}`}
                        className="font-black hover:text-brand-700"
                      >
                        {item.hospital}
                      </Link>
                      <p className="mt-0.5 text-xs font-mono text-stone-400">{item.id}</p>
                    </div>
                    <UrgencyPill urgency={item.urgency} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className={`status-chip ${STATUS_CHIP[item.status] ?? "status-inactive"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${item.status === "ACTIVE" ? "bg-emerald-500" : "bg-stone-400"}`} aria-hidden />
                      {item.status}
                    </span>

                    {item.status === "ACTIVE" && (
                      <button
                        className="button button-primary py-1.5 text-xs"
                        onClick={() => generate(item.id)}
                        id={`generate-matches-${item.id}`}
                      >
                        <Zap className="h-3 w-3" aria-hidden />
                        {t("nav.matches")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {items.length === 0 && (
            <div className="empty-state">
              <span className="grid h-14 w-14 place-items-center rounded-3xl bg-stone-50">
                <AlertCircle className="h-6 w-6 text-stone-300" aria-hidden />
              </span>
              <p className="font-bold text-stone-500">No requests yet</p>
              <p className="max-w-xs text-sm text-stone-400">{t("request.pending")}</p>
              <Link href="/requests/new" className="button button-primary mt-2">
                <Plus className="h-4 w-4" aria-hidden />
                {t("dashboard.newRequest")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RequestsPage() {
  return <AuthGuard><RequestsList /></AuthGuard>;
}
