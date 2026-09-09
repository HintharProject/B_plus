"use client";

import Link from "next/link";
import { Building2, Droplets, HandHeart, UserRound, ArrowRight, Bell } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { PushOptIn } from "@/components/notifications/push-opt-in";
import { NotificationList } from "@/components/notifications/notification-list";

const AVAILABILITY_COLORS: Record<string, string> = {
  AVAILABLE_NOW: "status-active",
  AVAILABLE_TODAY: "status-pending",
  PAUSED: "status-inactive",
};

const actions = [
  {
    href: "/requests/new",
    labelKey: "dashboard.newRequest",
    icon: Droplets,
    gradient: "from-brand-500 to-brand-700",
    description: "Submit a new blood need",
  },
  {
    href: "/donor",
    labelKey: "dashboard.donorProfile",
    icon: UserRound,
    gradient: "from-rose-400 to-brand-600",
    description: "Manage your availability",
  },
  {
    href: "/matches",
    labelKey: "dashboard.yourMatches",
    icon: HandHeart,
    gradient: "from-pink-400 to-rose-600",
    description: "View match invitations",
  },
  {
    href: "/organization",
    labelKey: "dashboard.organization",
    icon: Building2,
    gradient: "from-stone-500 to-stone-700",
    description: "Workspace & requests",
  },
];

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

      {/* Quick action cards — bento grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map(({ href, labelKey, icon: Icon, gradient, description }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-3xl border border-stone-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-lg"
            id={`action-${labelKey.replace(".", "-")}`}
          >
            {/* Subtle gradient hover bloom */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex items-start justify-between">
              <span
                className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${gradient} shadow-sm`}
              >
                <Icon className="h-5 w-5 text-white" aria-hidden />
              </span>
              <ArrowRight className="h-4 w-4 text-stone-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand-500" aria-hidden />
            </div>
            <p className="relative mt-4 font-black">{t(labelKey as Parameters<typeof t>[0])}</p>
            <p className="relative mt-1 text-xs text-stone-400">{description}</p>
          </Link>
        ))}
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
