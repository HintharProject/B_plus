"use client";

import { FormEvent, useState } from "react";
import { Check, LoaderCircle, MapPin, Calendar } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { bloodTypes } from "@/lib/domain";

const AVAILABILITY_OPTIONS = [
  {
    value: "AVAILABLE_NOW",
    emoji: "🟢",
    labelKey: "donor.availableNow" as const,
    color: "border-emerald-300 bg-emerald-50 text-emerald-800",
    selected: "ring-2 ring-emerald-400 ring-offset-1 border-emerald-400 bg-emerald-50 text-emerald-800",
  },
  {
    value: "AVAILABLE_TODAY",
    emoji: "🟡",
    labelKey: "donor.availableToday" as const,
    color: "border-amber-200 bg-amber-50 text-amber-800",
    selected: "ring-2 ring-amber-400 ring-offset-1 border-amber-300 bg-amber-50 text-amber-800",
  },
  {
    value: "PAUSED",
    emoji: "⏸️",
    labelKey: "donor.paused" as const,
    color: "border-stone-200 bg-stone-50 text-stone-600",
    selected: "ring-2 ring-stone-400 ring-offset-1 border-stone-300 bg-stone-100 text-stone-700",
  },
];

function DonorProfileForm() {
  const { t } = useLocale();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [availability, setAvailability] = useState("AVAILABLE_NOW");
  const [bloodType, setBloodType] = useState("O+");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setSaved(false);
    const data = new FormData(event.currentTarget);
    try {
      await apiRequest("/donor-profile", {
        method: "PUT",
        body: JSON.stringify({
          bloodType,
          availability,
          lastDonationDate: data.get("lastDonationDate") || null,
          coarseLocation: {
            stateRegion: data.get("stateRegion"),
            township: data.get("township"),
          },
        }),
      });
      setStatus(t("donor.saved"));
      setSaved(true);
    } catch {
      setStatus(t("errors.offline"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="section-heading">{t("donor.title")}</h1>
          <p className="section-sub">Manage your blood donation availability</p>
        </div>
      </div>

      <p className="notice notice-info mb-6 text-xs">{t("donor.safety")}</p>

      <form onSubmit={submit} className="max-w-lg space-y-6">
        {/* Blood Type */}
        <div className="auth-card">
          <p className="form-section-title">{t("donor.bloodType")}</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {bloodTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBloodType(type)}
                className={`rounded-xl border py-3 text-sm font-black transition-all ${
                  bloodType === type
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

        {/* Availability */}
        <div className="auth-card">
          <p className="form-section-title">{t("donor.availability")}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {AVAILABILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAvailability(opt.value)}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-bold transition-all ${
                  availability === opt.value ? opt.selected : opt.color
                }`}
                id={`availability-${opt.value}`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="auth-card space-y-4">
          <p className="form-section-title">
            <MapPin className="inline h-3.5 w-3.5 mr-1" aria-hidden />
            {t("donor.location")}
          </p>
          <label className="label">
            {t("request.stateRegion")}
            <input
              className="field mt-2"
              name="stateRegion"
              minLength={2}
              maxLength={80}
              placeholder="e.g. Yangon Region"
              required
              id="state-region-input"
            />
          </label>
          <label className="label">
            {t("request.township")}
            <input
              className="field mt-2"
              name="township"
              minLength={2}
              maxLength={80}
              placeholder="e.g. Kamayut"
              required
              id="township-input"
            />
          </label>
        </div>

        {/* Last donation (optional) */}
        <div className="auth-card">
          <p className="form-section-title">
            <Calendar className="inline h-3.5 w-3.5 mr-1" aria-hidden />
            {t("donor.lastDonation")}
          </p>
          <input
            className="field"
            name="lastDonationDate"
            type="date"
            id="last-donation-input"
          />
        </div>

        {status && (
          <p
            className={`notice ${saved ? "notice-success" : "notice-warning"}`}
            role="status"
          >
            {saved && <Check className="inline h-4 w-4 mr-1 text-emerald-600" aria-hidden />}
            {status}
          </p>
        )}

        <button
          className="button button-primary w-full py-3"
          disabled={busy}
          id="save-donor-btn"
        >
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          {busy ? "Saving…" : t("common.save")}
        </button>
      </form>
    </div>
  );
}

export default function DonorPage() {
  return <AuthGuard><DonorProfileForm /></AuthGuard>;
}
