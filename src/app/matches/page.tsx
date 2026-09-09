"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, MapPin } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { UrgencyPill } from "@/components/urgency-pill";
import type { Urgency } from "@/lib/domain";

type MatchItem = {
  id: string;
  status: string;
  request?: {
    bloodTypeNeeded: string;
    urgency: Urgency;
    hospital: string;
    coarseLocation: { township: string };
  };
};

const STATUS_LABEL: Record<string, { chip: string; label: string }> = {
  PENDING:  { chip: "status-pending",  label: "Awaiting response" },
  ACCEPTED: { chip: "status-active",   label: "Accepted" },
  DECLINED: { chip: "status-inactive", label: "Declined" },
  EXPIRED:  { chip: "status-inactive", label: "Expired" },
};

function MatchesList() {
  const { t } = useLocale();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ matches: MatchItem[] }>("/matches");
      setMatches(result.matches);
    } catch {
      setError(t("errors.offline"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="section-heading">{t("nav.matches")}</h1>
          <p className="section-sub">Your blood donation match invitations</p>
        </div>
      </div>

      {error && <p className="notice notice-warning mb-5">{error}</p>}

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-3xl" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {matches.map((match) => {
            const statusCfg = STATUS_LABEL[match.status] ?? { chip: "status-inactive", label: match.status };
            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="group flex items-start gap-4 rounded-3xl border border-stone-100 bg-white p-5 shadow-card transition-all duration-200 hover:border-brand-100 hover:shadow-md"
                id={`match-${match.id}`}
              >
                {/* Blood type badge */}
                <div className="blood-badge h-12 w-12 shrink-0 rounded-2xl text-base">
                  {match.request?.bloodTypeNeeded ?? "?"}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-black leading-tight group-hover:text-brand-700">
                      {match.request?.hospital ?? "—"}
                    </p>
                    {match.request && <UrgencyPill urgency={match.request.urgency} />}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {match.request && (
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {match.request.coarseLocation.township}
                      </span>
                    )}
                    <span className={`status-chip ${statusCfg.chip}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {matches.length === 0 && (
            <div className="empty-state">
              <span className="grid h-14 w-14 place-items-center rounded-3xl bg-stone-50">
                <AlertCircle className="h-6 w-6 text-stone-300" aria-hidden />
              </span>
              <p className="font-bold text-stone-500">No matches yet</p>
              <p className="max-w-xs text-sm text-stone-400">
                When you receive a match invitation, it will appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MatchesPage() {
  return <AuthGuard><MatchesList /></AuthGuard>;
}
