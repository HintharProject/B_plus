"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Phone,
  Send,
  MapPin,
  Calendar,
  Check,
  LoaderCircle,
  Building2,
  Navigation,
  ShieldCheck,
  LogOut,
  Copy,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { bloodTypes, type BloodType } from "@/lib/domain";

type MeData = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  profile: {
    displayName?: string;
    phone?: string;
    telegram?: string;
    roles?: string[];
  } | null;
  donorProfile: {
    bloodType?: BloodType;
    availability?: string;
    coarseLocation?: { township?: string; stateRegion?: string };
    lastDonationDate?: string | null;
    phone?: string;
    telegram?: string;
    coordinates?: { latitude: number; longitude: number };
  } | null;
  memberships: Array<{
    id: string;
    organizationId: string;
    role: string;
    status: string;
  }>;
};

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

function ProfileContent() {
  const { signOut } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  // Account & Contact fields
  const [userId, setUserId] = useState("");
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [memberships, setMemberships] = useState<MeData["memberships"]>([]);

  // Donor fields
  const [bloodType, setBloodType] = useState<BloodType>("O+");
  const [availability, setAvailability] = useState("AVAILABLE_NOW");
  const [stateRegion, setStateRegion] = useState("");
  const [township, setTownship] = useState("");
  const [lastDonationDate, setLastDonationDate] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsDetecting, setGpsDetecting] = useState(false);

  useEffect(() => {
    apiRequest<MeData>("/me")
      .then((data) => {
        setUserId(data.id ?? "");
        setEmail(data.email ?? "");
        setDisplayName(data.profile?.displayName ?? "");
        setPhone(data.profile?.phone ?? data.donorProfile?.phone ?? "");
        setTelegram(data.profile?.telegram ?? data.donorProfile?.telegram ?? "");
        setRoles(data.profile?.roles ?? ["REQUESTER"]);
        setMemberships(data.memberships ?? []);

        if (data.donorProfile) {
          if (data.donorProfile.bloodType) setBloodType(data.donorProfile.bloodType);
          if (data.donorProfile.availability) setAvailability(data.donorProfile.availability);
          if (data.donorProfile.coarseLocation?.stateRegion) setStateRegion(data.donorProfile.coarseLocation.stateRegion);
          if (data.donorProfile.coarseLocation?.township) setTownship(data.donorProfile.coarseLocation.township);
          if (data.donorProfile.lastDonationDate) setLastDonationDate(data.donorProfile.lastDonationDate);
          if (data.donorProfile.coordinates) setGpsCoords(data.donorProfile.coordinates);
        }
      })
      .catch(() => {
        setStatus(t("errors.offline"));
        setStatusType("error");
      })
      .finally(() => setLoading(false));
  }, [t]);

  function handleCopyUserId() {
    if (!userId) return;
    navigator.clipboard.writeText(userId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDetectGps() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          latitude: Math.round(pos.coords.latitude * 10000) / 10000,
          longitude: Math.round(pos.coords.longitude * 10000) / 10000,
        });
        setGpsDetecting(false);
      },
      () => {
        setGpsDetecting(false);
        alert("Unable to retrieve your current location.");
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");

    try {
      // 1. Update personal / account info
      await apiRequest("/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName,
          phone: phone || null,
          telegram: telegram ? telegram.replace(/^@/, "").trim() : null,
        }),
      });

      // 2. Update donor profile
      if (township && stateRegion) {
        await apiRequest("/donor-profile", {
          method: "PUT",
          body: JSON.stringify({
            bloodType,
            availability,
            lastDonationDate: lastDonationDate || null,
            phone: phone || null,
            telegram: telegram ? telegram.replace(/^@/, "").trim() : null,
            coarseLocation: {
              stateRegion,
              township,
            },
            coordinates: gpsCoords,
          }),
        });
      }

      setStatus(t("profile.saved"));
      setStatusType("success");
    } catch {
      setStatus(t("errors.offline"));
      setStatusType("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-heading">{t("profile.title")}</h1>
          <p className="section-sub">{t("profile.subtitle")}</p>
          {roles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-200"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          className="button button-secondary text-xs"
          onClick={async () => {
            await signOut();
            router.replace("/");
          }}
          id="profile-sign-out-btn"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          {t("common.signOut")}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 max-w-2xl">
          <div className="skeleton h-48 rounded-3xl" />
          <div className="skeleton h-64 rounded-3xl" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Status message */}
          {status && (
            <p
              className={`notice ${statusType === "success" ? "notice-success" : "notice-warning"} flex items-center gap-2`}
              role="status"
            >
              {statusType === "success" && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
              <span>{status}</span>
            </p>
          )}

          {/* ─── 1. Account & Contact Card ─── */}
          <div className="auth-card space-y-4">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <User className="h-4 w-4" aria-hidden />
              </span>
              <h2 className="text-base font-black text-ink">{t("profile.personalInfo")}</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Display Name */}
              <label className="label sm:col-span-2">
                {t("profile.displayName")}
                <input
                  className="field mt-1"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  id="profile-display-name"
                />
              </label>

              {/* Email (Read-only) */}
              <label className="label sm:col-span-2">
                {t("profile.email")}
                <input
                  className="field mt-1 bg-stone-50 text-stone-500 cursor-not-allowed"
                  value={email}
                  disabled
                  id="profile-email"
                />
              </label>

              {/* User ID (For invitations) */}
              {userId && (
                <div className="rounded-2xl border border-stone-200/90 bg-stone-50/80 p-3.5 sm:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        {t("profile.userId")}
                      </span>
                      <p className="font-mono text-xs font-bold text-ink break-all select-all mt-0.5">
                        {userId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUserId}
                      className="button button-secondary text-xs py-1.5 px-3 self-start sm:self-auto shrink-0 gap-1.5"
                      id="copy-user-id-btn"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                          <span className="text-emerald-700 font-bold">{t("common.copied")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-stone-500" aria-hidden />
                          <span>{t("common.copyId")}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-stone-500 leading-normal">
                    {t("profile.userIdHint")}
                  </p>
                </div>
              )}

              {/* Phone */}
              <label className="label">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-stone-400" aria-hidden />
                  {t("profile.phone")}
                </span>
                <input
                  className="field mt-1"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("profile.phonePlaceholder")}
                  id="profile-phone"
                />
              </label>

              {/* Telegram */}
              <label className="label">
                <span className="flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                  {t("profile.telegram")}
                </span>
                <div className="relative mt-1">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">@</span>
                  <input
                    className="field pl-8"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder={t("profile.telegramPlaceholder")}
                    id="profile-telegram"
                  />
                </div>
              </label>
            </div>

            {/* Privacy notice */}
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-xs leading-5 text-brand-900 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" aria-hidden />
              <span>{t("profile.contactNotice")}</span>
            </div>
          </div>

          {/* ─── 2. Blood Donor Profile Card ─── */}
          <div className="auth-card space-y-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-brand-600">
                <span className="font-black text-xs">B+</span>
              </span>
              <h2 className="text-base font-black text-ink">{t("profile.donorSection")}</h2>
            </div>

            {/* Blood Type Picker */}
            <div>
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

            {/* Availability options */}
            <div>
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

            {/* Location fields */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="form-section-title mb-0">
                  <MapPin className="inline h-3.5 w-3.5 mr-1" aria-hidden />
                  {t("donor.location")}
                </p>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={gpsDetecting}
                  className="button button-secondary py-1 px-3 text-xs gap-1.5"
                  id="detect-gps-btn"
                >
                  <Navigation className={`h-3 w-3 ${gpsDetecting ? "animate-spin text-brand-600" : ""}`} />
                  <span>{gpsCoords ? t("profile.gpsLocated") : t("profile.useGps")}</span>
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="label">
                  {t("request.stateRegion")}
                  <input
                    className="field mt-1"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    placeholder="e.g. Yangon Region"
                    required
                    id="profile-state-region"
                  />
                </label>
                <label className="label">
                  {t("request.township")}
                  <input
                    className="field mt-1"
                    value={township}
                    onChange={(e) => setTownship(e.target.value)}
                    placeholder="e.g. Kamayut"
                    required
                    id="profile-township"
                  />
                </label>
              </div>
            </div>

            {/* Last donation date */}
            <div>
              <p className="form-section-title">
                <Calendar className="inline h-3.5 w-3.5 mr-1" aria-hidden />
                {t("donor.lastDonation")}
              </p>
              <input
                className="field"
                type="date"
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
                id="profile-last-donation"
              />
            </div>
          </div>

          {/* ─── 3. My Organizations Card ─── */}
          <div className="auth-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-stone-100 text-stone-700">
                  <Building2 className="h-4 w-4" aria-hidden />
                </span>
                <h2 className="text-base font-black text-ink">{t("profile.myOrganizations")}</h2>
              </div>
              <Link href="/organization" className="text-xs font-bold text-brand-600 hover:underline">
                Manage
              </Link>
            </div>

            {memberships.length === 0 ? (
              <p className="text-xs text-stone-400 py-2">{t("profile.noOrganizations")}</p>
            ) : (
              <div className="space-y-2">
                {memberships.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/70 px-4 py-2.5 text-xs"
                  >
                    <span className="font-bold text-stone-800">{m.organizationId}</span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold text-stone-600 border border-stone-200">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={busy}
            className="button button-primary w-full py-3.5 text-base shadow-glow-sm"
            id="profile-save-btn"
          >
            {busy ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                <span>{t("common.loading")}</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" aria-hidden />
                <span>{t("common.save")}</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
