"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, Check, X } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { UrgencyPill } from "@/components/urgency-pill";

type MatchDetail = {
  id: string;
  status: string;
  isCandidate: boolean;
  conversationId?: string;
  request: {
    bloodTypeNeeded: string;
    urgency: "CRITICAL" | "URGENT" | "STANDARD";
    hospital: string;
    coarseLocation: { stateRegion: string; township: string };
    additionalInstructions?: string;
  };
};

function MatchView() {
  const params = useParams<{ id: string }>();
  const { t } = useLocale();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [status, setStatus] = useState("");
  const [destination, setDestination] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ match: MatchDetail }>(`/matches/${params.id}`);
      setMatch(result.match);
    } catch {
      setStatus(t("errors.unauthorized"));
    }
  }, [params.id, t]);

  useEffect(() => { void load(); }, [load]);

  async function respond(response: "ACCEPTED" | "DECLINED") {
    try {
      await apiRequest(`/matches/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ response }),
      });
      setStatus(response === "ACCEPTED" ? t("match.accepted") : t("match.declined"));
      await load();
    } catch {
      setStatus(t("errors.offline"));
    }
  }

  async function reveal() {
    try {
      const result = await apiRequest<{
        preciseDestination: { address?: string } | null;
        conversationId: string | null;
      }>(`/matches/${params.id}/reveal`, { method: "POST" });
      setDestination(result.preciseDestination?.address ?? t("match.noPrivateData"));
      if (result.conversationId && match) {
        setMatch({ ...match, conversationId: result.conversationId });
      }
    } catch {
      setStatus(t("errors.unauthorized"));
    }
  }

  async function revoke() {
    try {
      await apiRequest(`/matches/${params.id}`, { method: "DELETE" });
      setDestination(null);
      await load();
    } catch {
      setStatus(t("errors.offline"));
    }
  }

  if (!match?.request) {
    return (
      <div className="page-shell">
        <div className="space-y-4">
          <div className="skeleton h-8 w-32 rounded-2xl" />
          <div className="skeleton h-48 rounded-3xl" />
        </div>
        {status && <p className="notice notice-warning mt-4">{status}</p>}
      </div>
    );
  }

  return (
    <div className="page-shell">
      {/* Back nav */}
      <Link
        href="/matches"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 transition hover:text-brand-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t("nav.matches")}
      </Link>

      <div className="mx-auto max-w-2xl">
        {/* Header card */}
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="blood-badge h-12 w-12 shrink-0 rounded-2xl text-base">
                {match.request.bloodTypeNeeded}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
                  {t("match.title")}
                </p>
                <h1 className="mt-0.5 text-xl font-black leading-tight sm:text-2xl">
                  {match.request.hospital}
                </h1>
              </div>
            </div>
            <UrgencyPill urgency={match.request.urgency} />
          </div>

          {/* Location info */}
          <dl className="mt-5 grid grid-cols-1 gap-3 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-stone-400">
                {t("request.hospital")}
              </dt>
              <dd className="mt-1 font-bold">{match.request.hospital}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-stone-400">
                {t("request.township")}
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 font-bold">
                <MapPin className="h-3.5 w-3.5 text-stone-400" aria-hidden />
                {match.request.coarseLocation.township},{" "}
                {match.request.coarseLocation.stateRegion}
              </dd>
            </div>
          </dl>

          <p className="notice notice-info mt-4 text-xs sm:text-sm">
            {t("match.limitedNotice")}
          </p>

          {match.request.additionalInstructions && (
            <p className="mt-4 text-sm leading-7 text-stone-600">
              {match.request.additionalInstructions}
            </p>
          )}

          {/* Candidate actions — stacked on mobile */}
          {match.isCandidate && match.status === "PENDING" && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                className="button button-primary w-full py-3"
                onClick={() => respond("ACCEPTED")}
                id="accept-match-btn"
              >
                <Check className="h-4 w-4" aria-hidden />
                {t("match.accept")}
              </button>
              <button
                className="button button-secondary w-full py-3"
                onClick={() => respond("DECLINED")}
                id="decline-match-btn"
              >
                <X className="h-4 w-4" aria-hidden />
                {t("match.decline")}
              </button>
            </div>
          )}

          {/* Accepted state */}
          {match.status === "ACCEPTED" && (
            <div className="mt-5 space-y-3">
              <button
                className="button button-primary w-full"
                onClick={reveal}
                id="reveal-btn"
              >
                {t("match.reveal")}
              </button>
              {destination && (
                <p className="notice notice-success">{destination}</p>
              )}
              {match.conversationId && (
                <Link
                  className="button button-secondary w-full"
                  href={`/chat/${match.conversationId}`}
                  id="open-chat-btn"
                >
                  {t("chat.title")}
                </Link>
              )}
              <button
                className="w-full pt-1 text-center text-sm font-bold text-stone-400 underline-offset-2 transition hover:text-brand-700 hover:underline"
                onClick={revoke}
                id="revoke-btn"
              >
                {t("match.revoke")}
              </button>
            </div>
          )}

          {match.status === "EXPIRED" && (
            <p className="notice notice-warning mt-4">{t("match.expired")}</p>
          )}

          {status && (
            <p className="notice notice-info mt-4" role="status">{status}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MatchPage() {
  return <AuthGuard><MatchView /></AuthGuard>;
}
