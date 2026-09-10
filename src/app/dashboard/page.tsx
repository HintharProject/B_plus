"use client";

import Link from "next/link";
import { Building2, Droplets, HandHeart, UserRound, ArrowRight, Bell } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { PushOptIn } from "@/components/notifications/push-opt-in";
import { NotificationList } from "@/components/notifications/notification-list";

function DashboardContent() {
  const { user, signOut } = useAuth();
  const { t } = useLocale();

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "there";

  return (
    <div className="page-shell">
      {/* Greeting bar */}
      <div className="page-header">
        <div>
          <p className="text-sm font-semibold text-stone-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">
            Hello, {displayName} 👋
          </h1>
          <p className="section-sub">{t("dashboard.welcome")}</p>
        </div>
        <button
          className="button button-secondary text-xs"
          onClick={signOut}
          id="sign-out-btn"
        >
          {t("common.signOut")}
        </button>
      </div>

      {/* ─── ACTION HIERARCHY ─── */}
      <div className="space-y-4">
        {/* Tier 1: Primary Emergency Hero Card — Request Blood */}
        <Link
          href="/requests/new"
          className="group relative block overflow-hidden rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-white via-brand-50/40 to-brand-100/30 p-6 sm:p-7 shadow-[0_12px_40px_rgba(204,38,50,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-brand-400 hover:shadow-[0_16px_48px_rgba(204,38,50,0.18)]"
          id="action-request-blood"
        >
          {/* Subtle hover background highlight */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-50/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 shadow-glow-sm transition-transform duration-300 group-hover:scale-105">
                <Droplets className="h-7 w-7 text-white" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-brand-700">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
                    </span>
                    {t("dashboard.urgentBadge")}
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-black tracking-tight text-ink sm:text-2xl">
                  {t("dashboard.newRequest")}
                </h2>
                <p className="mt-1 text-sm text-stone-600 max-w-xl leading-relaxed">
                  {t("dashboard.newRequestDesc")}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <span className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-glow-sm transition-all duration-200 group-hover:bg-brand-700 group-hover:shadow-glow group-hover:translate-x-0.5 active:scale-[0.98]">
                <span>{t("dashboard.createRequestCta")}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
              </span>
            </div>
          </div>
        </Link>

        {/* Tier 2: Secondary Individual / Donor Actions (2 Columns) */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Donor profile card */}
          <Link
            href="/profile"
            className="group relative overflow-hidden rounded-3xl border border-stone-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
            id="action-donor-profile"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-rose-400 to-brand-600 shadow-sm">
                <UserRound className="h-5 w-5 text-white" aria-hidden />
              </span>
              <ArrowRight className="h-4 w-4 text-stone-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand-500" aria-hidden />
            </div>
            <p className="relative mt-4 text-base font-black text-ink">{t("dashboard.donorProfile")}</p>
            <p className="relative mt-1 text-xs leading-5 text-stone-400">{t("dashboard.donorProfileDesc")}</p>
          </Link>

          {/* Matches card */}
          <Link
            href="/matches"
            className="group relative overflow-hidden rounded-3xl border border-stone-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
            id="action-your-matches"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 shadow-sm">
                <HandHeart className="h-5 w-5 text-white" aria-hidden />
              </span>
              <ArrowRight className="h-4 w-4 text-stone-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand-500" aria-hidden />
            </div>
            <p className="relative mt-4 text-base font-black text-ink">{t("dashboard.yourMatches")}</p>
            <p className="relative mt-1 text-xs leading-5 text-stone-400">{t("dashboard.yourMatchesDesc")}</p>
          </Link>
        </div>

        {/* Tier 3: Tertiary Institutional / Organization Workspace Card */}
        <Link
          href="/organization"
          className="group relative flex flex-col items-start justify-between gap-4 rounded-3xl border border-stone-200/90 bg-stone-50/60 p-5 sm:flex-row sm:items-center sm:p-6 transition-all duration-300 hover:border-stone-300 hover:bg-white hover:shadow-card"
          id="action-organization-workspace"
        >
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-stone-600 to-stone-800 text-white shadow-sm">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-black text-ink">{t("dashboard.organization")}</p>
              <p className="text-xs text-stone-500">{t("dashboard.organizationDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 group-hover:text-brand-600">
            <span>Open</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </div>
        </Link>
      </div>

      {/* Push opt-in + notifications */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-stone-400" aria-hidden />
          <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Notifications</h2>
        </div>
        <PushOptIn />
        <NotificationList />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
