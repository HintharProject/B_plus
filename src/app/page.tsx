"use client";

import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Droplets,
  Users,
  MapPin,
  Clock,
} from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";

/* ─── Floating mock "request card" shown in hero ─────────────────── */
function MockRequestCard({
  blood,
  hospital,
  location,
  urgency,
  time,
  accepted,
}: {
  blood: string;
  hospital: string;
  location: string;
  urgency: "CRITICAL" | "URGENT" | "STANDARD";
  time: string;
  accepted?: boolean;
}) {
  const urgencyStyle = {
    CRITICAL: "border-red-200 bg-red-50 text-red-700",
    URGENT: "border-amber-200 bg-amber-50 text-amber-800",
    STANDARD: "border-sky-200 bg-sky-50 text-sky-700",
  }[urgency];
  const urgencyDot = {
    CRITICAL: "bg-red-500 animate-pulse",
    URGENT: "bg-amber-500",
    STANDARD: "bg-sky-500",
  }[urgency];

  return (
    <div
      className={`relative flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_4px_24px_rgba(37,28,29,0.08)] transition-all ${
        accepted ? "border-emerald-200 ring-1 ring-emerald-200" : "border-stone-100"
      }`}
    >
      {/* Blood type */}
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-sm font-black text-white shadow-sm">
        {blood}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-black leading-tight text-stone-800">{hospital}</p>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${urgencyStyle}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${urgencyDot}`} />
            {urgency === "CRITICAL" ? "Critical" : urgency === "URGENT" ? "Urgent" : "Standard"}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-stone-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden />
            {location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            {time}
          </span>
        </div>
        {accepted && (
          <p className="mt-2 text-xs font-bold text-emerald-600">✓ Match accepted — coordination started</p>
        )}
      </div>
    </div>
  );
}

/* ─── Privacy shield visual ──────────────────────────────────────── */
function PrivacyShield() {
  return (
    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-brand-100 bg-gradient-to-b from-brand-50 to-white p-5 shadow-sm">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 shadow-glow-sm">
        <ShieldCheck className="h-6 w-6 text-white" aria-hidden />
      </div>
      <p className="mt-3 text-center text-xs font-bold text-brand-900">Privacy protected</p>
      <div className="mt-3 flex flex-col gap-1.5 w-full">
        {["Contact details", "Precise location", "Patient identity"].map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-1.5 text-xs text-stone-500 border border-stone-100">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" aria-hidden />
            {item} hidden until accepted
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main landing page ──────────────────────────────────────────── */
function LandingPage() {
  const { t } = useLocale();

  const steps = [
    {
      icon: LockKeyhole,
      number: "01",
      title: t("home.limited"),
      text: t("home.limitedText"),
      color: "from-brand-500 to-brand-700",
    },
    {
      icon: HeartHandshake,
      number: "02",
      title: t("home.consent"),
      text: t("home.consentText"),
      color: "from-rose-400 to-brand-600",
    },
    {
      icon: MessageCircle,
      number: "03",
      title: t("home.connect"),
      text: t("home.connectText"),
      color: "from-pink-400 to-rose-600",
    },
  ];

  const stats = [
    { icon: ShieldCheck, label: "Privacy-first" },
    { icon: Users, label: "Verified orgs" },
    { icon: Droplets, label: "Anonymous matching" },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-cream">
        {/* Layered radial gradients */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_-20%,#ffd6d8_0%,transparent_65%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_50%_at_100%_60%,#ffe4e6_0%,transparent_60%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_35%_40%_at_0%_80%,#fff0f0_0%,transparent_55%)]" aria-hidden />

        {/* Decorative large ring */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full border border-brand-100/50"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-[400px] w-[400px] rounded-full border border-brand-200/40"
          aria-hidden
        />

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-20">
          {/* ── Left: Copy ── */}
          <div>
            {/* Eyebrow */}
            <div className="animate-fade-up">
              <span className="eyebrow-badge">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
                </span>
                {t("home.eyebrow")}
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up-delay mt-6 text-[2.1rem] font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.2rem]">
              Find willing donors.
              <br />
              <span className="gradient-text">Protect privacy.</span>
            </h1>

            {/* Description */}
            <p className="animate-fade-up-delay-2 mt-5 max-w-lg text-base leading-8 text-stone-500">
              {t("home.description")}
            </p>

            {/* CTAs */}
            <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="button button-primary px-6 py-3 text-base shadow-glow-sm"
                id="hero-primary-cta"
              >
                {t("home.primaryAction")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#how-it-works"
                className="button button-secondary px-6 py-3 text-base"
                id="hero-secondary-cta"
              >
                {t("home.secondaryAction")}
              </a>
            </div>

            {/* Trust pills */}
            <div className="animate-fade-up-delay-3 mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-stone-100 pt-7">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <span key={i} className="stat-pill">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50">
                      <Icon className="h-3 w-3 text-brand-600" aria-hidden />
                    </span>
                    {stat.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* ── Right: Visual panel ── */}
          <div className="animate-fade-up-delay-2 hidden lg:flex lg:flex-col lg:gap-4">
            {/* Mock active requests */}
            <div className="flex flex-col gap-3">
              <MockRequestCard
                blood="O+"
                hospital="Yangon General Hospital"
                location="Pabedan, Yangon"
                urgency="CRITICAL"
                time="Needed in 2 hrs"
              />
              <MockRequestCard
                blood="AB−"
                hospital="Mandalay Children's Hospital"
                location="Chan Mya Tharsi, Mandalay"
                urgency="URGENT"
                time="Needed by 6 PM"
                accepted
              />
              <MockRequestCard
                blood="B+"
                hospital="North Okkalapa Hospital"
                location="North Okkalapa, Yangon"
                urgency="STANDARD"
                time="Needed tomorrow"
              />
            </div>

            {/* Privacy shield */}
            <PrivacyShield />
          </div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-cream to-transparent" aria-hidden />
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section id="how-it-works" className="relative bg-cream">
        {/* Subtle top separator */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
        </div>

        <div className="page-shell py-20 sm:py-28">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {t("home.secondaryAction")}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Simple, safe, and transparent
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-stone-500">
              Coordination happens in three clear steps — no personal data leaves your control until you choose.
            </p>
          </div>

          <div className="relative grid gap-6 md:grid-cols-3">
            {/* Connecting dashes — desktop */}
            <div
              className="pointer-events-none absolute left-[calc(33.33%+1.5rem)] right-[calc(33.33%+1.5rem)] top-[3.5rem] hidden h-px border-t-2 border-dashed border-brand-200 md:block"
              aria-hidden
            />

            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.number} className="step-card group">
                  <span className="absolute right-5 top-4 select-none font-black text-7xl leading-none text-stone-50">
                    {step.number}
                  </span>
                  <span
                    className={`relative z-10 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${step.color} shadow-sm`}
                  >
                    <Icon className="h-5 w-5 text-white" aria-hidden />
                  </span>
                  <h3 className="relative z-10 mt-5 text-lg font-black">{step.title}</h3>
                  <p className="relative z-10 mt-2 text-sm leading-7 text-stone-500">
                    {step.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust / Boundary ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0608] via-brand-900 to-[#2a0c10]">
        <div className="dot-grid absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 animate-spin-slow rounded-full border border-white/5"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 animate-spin-slow rounded-full border border-white/5"
          style={{ animationDirection: "reverse", animationDelay: "3s" }}
          aria-hidden
        />

        <div className="page-shell relative z-10 py-20 sm:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
              <HeartHandshake className="h-7 w-7 text-brand-200" aria-hidden />
            </span>
            <h2 className="mt-7 text-3xl font-black text-white sm:text-4xl">
              {t("home.boundaryTitle")}
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-300">
              {t("home.boundaryText")}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-8 text-sm font-semibold">
              <Link href="/about" className="text-stone-400 transition hover:text-white">About B+</Link>
              <span className="text-white/20" aria-hidden>·</span>
              <Link href="/how-it-works" className="text-stone-400 transition hover:text-white">How it works</Link>
              <span className="text-white/20" aria-hidden>·</span>
              <Link href="/safety" className="text-stone-400 transition hover:text-white">Safety &amp; Privacy</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default LandingPage;
