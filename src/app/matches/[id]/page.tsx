"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Check,
  X,
  Phone,
  Send,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { UrgencyPill } from "@/components/urgency-pill";

type MatchDetail = {
  id: string;
  status: string;
  isCandidate: boolean;
  candidateType?: "INDIVIDUAL" | "ORGANIZATION";
  distanceKm?: number;
  conversationId?: string;
  request: {
    bloodTypeNeeded: string;
    urgency: "CRITICAL" | "URGENT" | "STANDARD";
    hospital: string;
    coarseLocation: { stateRegion: string; township: string };
    additionalInstructions?: string;
  };
};

type RevealResult = {
  preciseDestination: { address?: string } | null;
  contactInfo: { phone?: string | null; telegram?: string | null } | null;
  conversationId: string | null;
};

function MatchView() {
  const params = useParams<{ id: string }>();
  const { t } = useLocale();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [status, setStatus] = useState("");
  const [destination, setDestination] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState<{ phone?: string | null; telegram?: string | null } | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ match: MatchDetail }>(`/matches/${params.id}`);
      setMatch(result.match);
    } catch {
      setStatus(t("errors.unauthorized"));
    }
  }, [params.id, t]);

  useEffect(() => {
    void load();
  }, [load]);

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
      const result = await apiRequest<RevealResult>(`/matches/${params.id}/reveal`, {
        method: "POST",
      });
      if (result.preciseDestination) {
        setDestination(result.preciseDestination.address ?? t("match.noPrivateData"));
      }
      if (result.contactInfo) {
        setContactInfo(result.contactInfo);
      }
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
      setContactInfo(null);
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
            <div className="flex flex-wrap items-center gap-2">
              {match.distanceKm !== undefined && match.distanceKm !== null && (
                <span className="status-chip bg-stone-100 text-stone-700 border-stone-200">
                  <MapPin className="h-3 w-3 text-stone-500" />
                  {match.distanceKm} {t("match.distanceKm")}
                </span>
              )}
              <UrgencyPill urgency={match.request.urgency} />
            </div>
          </div>

          {/* Location info */}
          <dl className="mt-5 grid grid-cols-1 gap-3 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-stone-400">
                {t("request.hospital")}
              </dt>
              <dd className="mt-1 font-bold text-ink">{match.request.hospital}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-stone-400">
                {t("request.township")}
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 font-bold text-ink">
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

          {/* Candidate actions — for pending match */}
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
            <div className="mt-6 space-y-4">
              <button
                className="button button-primary w-full py-3 shadow-glow-sm"
                onClick={reveal}
                id="reveal-btn"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{t("match.reveal")}</span>
              </button>

              {/* Destination revealed */}
              {destination && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Destination Location
                  </p>
                  <p className="mt-1 font-bold text-emerald-950">{destination}</p>
                </div>
              )}

              {/* Contact info revealed (Phone / Telegram) */}
              {contactInfo && (
                <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-white p-5 space-y-3">
                  <p className="text-xs font-black uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{t("match.contactDetails")}</span>
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {contactInfo.phone ? (
                      <a
                        href={`tel:${contactInfo.phone}`}
                        className="button button-primary w-full gap-2 text-sm"
                        id="call-donor-btn"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{t("match.directCall")}: {contactInfo.phone}</span>
                      </a>
                    ) : (
                      <p className="text-xs text-stone-400 self-center">No phone number provided</p>
                    )}

                    {contactInfo.telegram ? (
                      <a
                        href={`https://t.me/${contactInfo.telegram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button bg-[#229ED9] text-white hover:bg-[#1e8ec3] w-full gap-2 text-sm shadow-sm"
                        id="telegram-donor-btn"
                      >
                        <Send className="h-4 w-4" />
                        <span>{t("match.openTelegram")}: @{contactInfo.telegram}</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              )}

              {/* In-app chat */}
              {match.conversationId && (
                <Link
                  className="button button-secondary w-full gap-2 py-3"
                  href={`/chat/${match.conversationId}`}
                  id="open-chat-btn"
                >
                  <MessageCircle className="h-4 w-4 text-brand-600" />
                  <span>{t("chat.title")}</span>
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
            <p className="notice notice-info mt-4" role="status">
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MatchPage() {
  return (
    <AuthGuard>
      <MatchView />
    </AuthGuard>
  );
}
