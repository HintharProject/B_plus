"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  Check,
  Building2,
  Mail,
  LoaderCircle,
  HelpCircle,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LoadingFallback } from "@/components/loading-fallback";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";

type MemberItem = {
  id: string;
  userId: string;
  role: "OWNER" | "COORDINATOR" | "VIEWER";
  status: "ACTIVE" | "PENDING" | "DECLINED";
  userDisplayName?: string | null;
  userEmail?: string | null;
};

type OrgInfo = {
  id: string;
  name: string;
  type: string;
};

function MembersManager() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId") ?? "";
  const { t } = useLocale();

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");

  const [inviteInput, setInviteInput] = useState("");
  const [role, setRole] = useState<"COORDINATOR" | "VIEWER" | "OWNER">("COORDINATOR");

  const loadData = useCallback(async () => {
    if (!organizationId) return;
    try {
      const [membersRes, orgRes] = await Promise.all([
        apiRequest<{ members: MemberItem[] }>(`/organizations/${organizationId}/members`),
        apiRequest<{ organization: OrgInfo }>(`/organizations/${organizationId}`),
      ]);
      setMembers(membersRes.members ?? []);
      setOrg(orgRes.organization ?? null);
    } catch {
      setStatus(t("errors.offline"));
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  }, [organizationId, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inviteInput.trim() || !organizationId) return;

    setSubmitting(true);
    setStatus("");

    try {
      await apiRequest(`/organizations/${organizationId}/members`, {
        method: "PUT",
        body: JSON.stringify({
          userId: inviteInput.trim(),
          role,
        }),
      });
      setStatus(t("organization.invitedSuccess"));
      setStatusType("success");
      setInviteInput("");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.unauthorized");
      setStatus(msg);
      setStatusType("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(targetUserId: string) {
    if (!confirm(t("organization.removeMemberConfirm"))) return;
    try {
      await apiRequest(`/organizations/${organizationId}/members?userId=${targetUserId}`, {
        method: "DELETE",
      });
      await loadData();
    } catch {
      setStatus(t("errors.unauthorized"));
      setStatusType("error");
    }
  }

  return (
    <section className="page-shell max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/organization"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-ink mb-3 transition"
          id="back-to-org-link"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t("common.back")}</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-ink">
              {org?.name ? `${org.name} — ${t("organization.members")}` : t("organization.members")}
            </h1>
            <p className="text-xs text-stone-500">
              Invite and manage coordinators and team members
            </p>
          </div>
        </div>
      </div>

      {status && (
        <p
          className={`notice ${statusType === "success" ? "notice-success" : "notice-warning"} flex items-center gap-2`}
          role="status"
        >
          {statusType === "success" && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
          <span>{status}</span>
        </p>
      )}

      {/* Invite Member Card */}
      <form className="auth-card space-y-4" onSubmit={handleInvite}>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <UserPlus className="h-4 w-4" />
          </span>
          <h2 className="text-base font-bold text-ink">{t("organization.inviteMember")}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* User ID or Email input */}
          <label className="label sm:col-span-2">
            {t("organization.userIdOrEmail")}
            <input
              className="field mt-1"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="e.g. user@gmail.com or 28-char User ID"
              required
              id="invite-user-input"
            />
          </label>

          {/* Role selector */}
          <label className="label">
            {t("common.roles")}
            <select
              className="field mt-1"
              value={role}
              onChange={(e) => setRole(e.target.value as "COORDINATOR" | "VIEWER" | "OWNER")}
              id="invite-role-select"
            >
              <option value="COORDINATOR">{t("organization.coordinator")}</option>
              <option value="VIEWER">{t("organization.viewer")}</option>
              <option value="OWNER">{t("organization.owner")}</option>
            </select>
          </label>
        </div>

        {/* Helpful explanation box */}
        <div className="flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs text-stone-600 ring-1 ring-stone-200/60">
          <HelpCircle className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {t("organization.inviteHint")}
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || !organizationId || !inviteInput.trim()}
          className="button button-primary gap-2"
          id="invite-submit-btn"
        >
          {submitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span>{t("common.loading")}</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span>{t("organization.inviteMember")}</span>
            </>
          )}
        </button>
      </form>

      {/* Existing Members List Card */}
      <div className="card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-stone-100 text-stone-600">
              <Users className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-ink">{t("organization.membersList")}</h2>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            {members.length} {members.length === 1 ? "member" : "members"}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-xs text-stone-500 py-4 text-center">{t("organization.noMembers")}</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {members.map((m) => {
              const isOwnerRole = m.role === "OWNER";
              const isPending = m.status === "PENDING";

              return (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-ink truncate">
                        {m.userDisplayName || m.userEmail || m.userId}
                      </span>
                      {/* Role badge */}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isOwnerRole
                          ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                          : m.role === "COORDINATOR"
                          ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200"
                          : "bg-stone-100 text-stone-700 ring-1 ring-stone-200"
                      }`}>
                        {m.role}
                      </span>
                      {/* Status badge */}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isPending
                          ? "bg-amber-50 text-amber-700"
                          : m.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                      {m.userEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {m.userEmail}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-stone-400">
                        ID: {m.userId}
                      </span>
                    </div>
                  </div>

                  {!isOwnerRole && (
                    <button
                      type="button"
                      onClick={() => handleRemove(m.userId)}
                      className="grid h-8 w-8 place-items-center rounded-xl border border-rose-200 bg-rose-50/60 text-rose-600 transition hover:bg-rose-100 self-start sm:self-auto shrink-0"
                      title={t("common.remove")}
                      id={`remove-member-${m.userId}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function MembersPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<LoadingFallback />}>
        <MembersManager />
      </Suspense>
    </AuthGuard>
  );
}
