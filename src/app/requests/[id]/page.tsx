"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { UrgencyPill } from "@/components/urgency-pill";
import type { Urgency } from "@/lib/domain";

type RequestDetail = {
  id: string;
  hospital: string;
  bloodTypeNeeded: string;
  urgency: Urgency;
  status: string;
  coarseLocation: { stateRegion: string; township: string };
};

const STATUS_CHIP: Record<string, string> = {
  ACTIVE: "status-active",
  PENDING_VERIFICATION: "status-pending",
};

function RequestView() {
  const params = useParams<{ id: string }>();
  const { t } = useLocale();
  const [item, setItem] = useState<RequestDetail | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ request: RequestDetail }>(`/requests/${params.id}`);
      setItem(result.request);
    } catch {
      setMessage(t("errors.unauthorized"));
    }
  }, [params.id, t]);

  useEffect(() => { void load(); }, [load]);

  async function update(action: "CANCEL" | "CLOSE") {
    try {
      await apiRequest(`/requests/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await load();
    } catch {
      setMessage(t("errors.offline"));
    }
  }

  if (!item) {
    return (
      <div className="page-shell">
        <div className="skeleton mb-4 h-5 w-24 rounded-xl" />
        <div className="skeleton h-48 rounded-3xl" />
        {message && <p className="notice notice-warning mt-4">{message}</p>}
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Link
        href="/requests"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition hover:text-brand-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t("nav.requests")}
      </Link>

      <article className="card mx-auto max-w-2xl p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="blood-badge h-12 w-12 shrink-0 rounded-2xl text-base">
              {item.bloodTypeNeeded}
            </div>
            <div>
              <p className="font-mono text-xs text-stone-400">{item.id}</p>
              <h1 className="mt-0.5 text-lg font-black leading-tight sm:text-xl">
                {item.hospital}
              </h1>
            </div>
          </div>
          <UrgencyPill urgency={item.urgency} />
        </div>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`status-chip ${STATUS_CHIP[item.status] ?? "status-inactive"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${item.status === "ACTIVE" ? "bg-emerald-500" : "bg-stone-400"}`} aria-hidden />
            {item.status}
          </span>
          <span className="flex items-center gap-1 text-sm text-stone-400">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {item.coarseLocation.township}, {item.coarseLocation.stateRegion}
          </span>
        </div>

        {/* Actions — full-width stacked on mobile */}
        {["ACTIVE", "PENDING_VERIFICATION"].includes(item.status) && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="button button-secondary w-full sm:w-auto"
              onClick={() => update("CANCEL")}
              id="cancel-request-btn"
            >
              {t("common.cancel")}
            </button>
            <button
              className="button button-primary w-full sm:w-auto"
              onClick={() => update("CLOSE")}
              id="close-request-btn"
            >
              {t("common.close")}
            </button>
          </div>
        )}

        {message && (
          <p className="notice notice-warning mt-4">{message}</p>
        )}
      </article>
    </div>
  );
}

export default function RequestPage() {
  return <AuthGuard><RequestView /></AuthGuard>;
}
