"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, LoaderCircle, Droplets } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LoadingFallback } from "@/components/loading-fallback";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { bloodTypes, urgencies } from "@/lib/domain";

type Draft = {
  bloodTypeNeeded: string;
  urgency: string;
  hospital: string;
  stateRegion: string;
  township: string;
  unitsRequired: string;
  neededBy: string;
  expiresAt: string;
  preciseDestination: string;
  additionalInstructions: string;
};

const emptyDraft: Draft = {
  bloodTypeNeeded: "O+",
  urgency: "URGENT",
  hospital: "",
  stateRegion: "",
  township: "",
  unitsRequired: "1",
  neededBy: "",
  expiresAt: "",
  preciseDestination: "",
  additionalInstructions: "",
};

const STEPS = [
  { number: 1, label: "Blood Info" },
  { number: 2, label: "Location" },
  { number: 3, label: "Timing" },
];

const URGENCY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: "text-red-700", bg: "bg-red-50 border-red-200", label: "Critical" },
  URGENT:   { color: "text-amber-800", bg: "bg-amber-50 border-amber-200", label: "Urgent" },
  STANDARD: { color: "text-sky-700", bg: "bg-sky-50 border-sky-200", label: "Standard" },
};

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2" aria-label="Form progress">
      {STEPS.map((step, i) => {
        const done = step.number < current;
        const active = step.number === current;
        return (
          <div key={step.number} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`wizard-step ${done ? "wizard-step-done" : active ? "wizard-step-active" : "wizard-step-pending"}`}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : step.number}
              </span>
              <span className={`text-[10px] font-bold ${active ? "text-brand-700" : done ? "text-brand-500" : "text-stone-400"}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className={`mb-4 h-px w-10 sm:w-16 ${done ? "bg-brand-300" : "bg-stone-200"}`} aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

function NewRequestForm() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");
  const [draft, setDraft] = useState(emptyDraft);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("bplus-request-draft");
    if (saved) {
      try { setDraft({ ...emptyDraft, ...JSON.parse(saved) }); } catch {
        window.localStorage.removeItem("bplus-request-draft");
      }
    }
    setReady(true);
  }, []);

  function update(field: keyof Draft, value: string) {
    setDraft((current) => {
      const next = { ...current, [field]: value };
      window.localStorage.setItem("bplus-request-draft", JSON.stringify(next));
      return next;
    });
  }

  async function submit() {
    setBusy(true);
    setStatus("");
    try {
      const result = await apiRequest<{ requestId: string; status: string }>("/requests", {
        method: "POST",
        body: JSON.stringify({
          bloodTypeNeeded: draft.bloodTypeNeeded,
          urgency: draft.urgency,
          hospital: draft.hospital,
          coarseLocation: { stateRegion: draft.stateRegion, township: draft.township },
          unitsRequired: Number(draft.unitsRequired),
          neededBy: new Date(draft.neededBy).toISOString(),
          expiresAt: new Date(draft.expiresAt).toISOString(),
          additionalInstructions: draft.additionalInstructions,
          organizationId: organizationId || null,
          preciseDestination: draft.preciseDestination
            ? { address: draft.preciseDestination }
            : undefined,
        }),
      });
      window.localStorage.removeItem("bplus-request-draft");
      setDraft(emptyDraft);
      setStatus(`${t("request.success")} ${result.requestId}`);
      setDone(true);
    } catch {
      setStatus(t("request.failed"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <LoadingFallback />;

  // Success screen
  if (done) {
    return (
      <div className="page-shell flex flex-col items-center justify-center py-20 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50">
          <Check className="h-8 w-8 text-emerald-600" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-black">{t("request.success").replace(/\..*/, "")}</h1>
        <p className="mt-2 text-sm text-stone-500">{status}</p>
        <button
          className="button button-primary mt-8"
          onClick={() => { setStep(1); setDone(false); setStatus(""); }}
        >
          Create another request
        </button>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-xl mx-auto">
      {/* Page title */}
      <div className="mb-6 text-center">
        <h1 className="section-heading">{t("request.newTitle")}</h1>
        <p className="section-sub">{t("request.savedDraft")}</p>
      </div>

      <StepIndicator current={step} />

      {/* Privacy notice */}
      <p className="notice notice-warning mb-6 text-xs">{t("request.minimalNotice")}</p>
      {!organizationId && (
        <p className="notice notice-info mb-6 text-xs">{t("request.pending")}</p>
      )}

      {/* ── Step 1: Blood Info ─── */}
      {step === 1 && (
        <div className="auth-card space-y-6">
          <div>
            <p className="form-section-title">{t("request.bloodType")}</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {bloodTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => update("bloodTypeNeeded", type)}
                  className={`rounded-xl border py-3 text-sm font-black transition-all ${
                    draft.bloodTypeNeeded === type
                      ? "border-brand-600 bg-brand-600 text-white shadow-glow-sm"
                      : "border-stone-200 bg-white text-stone-700 hover:border-brand-300"
                  }`}
                  id={`blood-type-${type}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="form-section-title">{t("request.urgency")}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {urgencies.map((urgency) => {
                const cfg = URGENCY_CONFIG[urgency] ?? {};
                return (
                  <button
                    key={urgency}
                    type="button"
                    onClick={() => update("urgency", urgency)}
                    className={`rounded-xl border py-3 text-sm font-bold transition-all ${
                      draft.urgency === urgency
                        ? `${cfg.bg} ${cfg.color} ring-2 ring-offset-1 ring-current`
                        : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                    }`}
                    id={`urgency-${urgency}`}
                  >
                    {cfg.label ?? urgency}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="form-section-title">{t("request.units")}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="button button-secondary h-10 w-10 p-0 text-lg"
                onClick={() => update("unitsRequired", String(Math.max(1, Number(draft.unitsRequired) - 1)))}
              >−</button>
              <span className="w-12 text-center text-xl font-black">{draft.unitsRequired}</span>
              <button
                type="button"
                className="button button-secondary h-10 w-10 p-0 text-lg"
                onClick={() => update("unitsRequired", String(Math.min(10, Number(draft.unitsRequired) + 1)))}
              >+</button>
              <span className="text-sm text-stone-400">units</span>
            </div>
          </div>

          <label className="label">
            {t("request.hospital")}
            <input
              className="field mt-2"
              value={draft.hospital}
              onChange={(e) => update("hospital", e.target.value)}
              minLength={2}
              maxLength={160}
              placeholder="e.g. Yangon General Hospital"
              required
              id="hospital-input"
            />
          </label>

          <button
            type="button"
            className="button button-primary w-full"
            onClick={() => setStep(2)}
            disabled={!draft.hospital || !draft.bloodTypeNeeded}
            id="step1-next"
          >
            Location <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}

      {/* ── Step 2: Location ─── */}
      {step === 2 && (
        <div className="auth-card space-y-5">
          <label className="label">
            {t("request.stateRegion")}
            <input
              className="field mt-2"
              value={draft.stateRegion}
              onChange={(e) => update("stateRegion", e.target.value)}
              placeholder="e.g. Yangon Region"
              required
              id="state-region-input"
            />
          </label>
          <label className="label">
            {t("request.township")}
            <input
              className="field mt-2"
              value={draft.township}
              onChange={(e) => update("township", e.target.value)}
              placeholder="e.g. Kamayut"
              required
              id="township-input"
            />
          </label>
          <label className="label">
            {t("request.preciseDestination")}
            <span className="ml-2 text-xs font-normal text-stone-400">(revealed only after acceptance)</span>
            <input
              className="field mt-2"
              value={draft.preciseDestination}
              onChange={(e) => update("preciseDestination", e.target.value)}
              maxLength={240}
              autoComplete="off"
              id="precise-destination-input"
            />
          </label>

          <div className="flex gap-3">
            <button type="button" className="button button-secondary flex-1" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden /> Back
            </button>
            <button
              type="button"
              className="button button-primary flex-1"
              onClick={() => setStep(3)}
              disabled={!draft.stateRegion || !draft.township}
              id="step2-next"
            >
              Timing <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Timing & Details ─── */}
      {step === 3 && (
        <div className="auth-card space-y-5">
          <label className="label">
            {t("request.neededBy")}
            <input
              className="field mt-2"
              type="datetime-local"
              value={draft.neededBy}
              onChange={(e) => update("neededBy", e.target.value)}
              required
              id="needed-by-input"
            />
          </label>
          <label className="label">
            {t("request.expiresAt")}
            <input
              className="field mt-2"
              type="datetime-local"
              value={draft.expiresAt}
              onChange={(e) => update("expiresAt", e.target.value)}
              required
              id="expires-at-input"
            />
          </label>
          <label className="label">
            {t("request.instructions")}
            <span className="ml-2 text-xs font-normal text-stone-400">(optional)</span>
            <textarea
              className="field mt-2 min-h-24"
              value={draft.additionalInstructions}
              onChange={(e) => update("additionalInstructions", e.target.value)}
              maxLength={500}
              id="instructions-input"
            />
          </label>

          {status && !done && (
            <p className="notice notice-warning" role="alert">{status}</p>
          )}

          <div className="flex gap-3">
            <button type="button" className="button button-secondary flex-1" onClick={() => setStep(2)}>
              <ChevronLeft className="h-4 w-4" aria-hidden /> Back
            </button>
            <button
              type="button"
              className="button button-primary flex-1"
              disabled={busy || !draft.neededBy || !draft.expiresAt}
              onClick={submit}
              id="submit-request-btn"
            >
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
              {t("request.submit")}
              {!busy && <Droplets className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<LoadingFallback />}>
        <NewRequestForm />
      </Suspense>
    </AuthGuard>
  );
}
