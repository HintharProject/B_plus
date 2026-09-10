"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  Plus,
  Users,
  Pencil,
  Trash2,
  MapPin,
  X,
  LoaderCircle,
  AlertTriangle,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { organizationTypes, type OrganizationType } from "@/lib/domain";

type OrgDetails = {
  id: string;
  name: string;
  type: OrganizationType;
  description?: string;
  verificationStatus?: string;
  coarseLocation?: { township: string; stateRegion: string };
};

type Membership = {
  organizationId: string;
  role: string;
  status: string;
  orgData?: OrgDetails | null;
};

function OrganizationWorkspace() {
  const { t } = useLocale();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editingOrg, setEditingOrg] = useState<OrgDetails | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  // Delete modal state
  const [deletingOrgId, setDeletingOrgId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await apiRequest<{ memberships: Membership[] }>("/me");
      // Fetch details for each organization
      const enriched = await Promise.all(
        result.memberships.map(async (m) => {
          try {
            const orgRes = await apiRequest<{ organization: OrgDetails }>(
              `/organizations/${m.organizationId}`,
            );
            return { ...m, orgData: orgRes.organization };
          } catch {
            return { ...m, orgData: null };
          }
        }),
      );
      setMemberships(enriched);
    } catch {
      setStatus(t("errors.offline"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await apiRequest<{ organizationId: string }>("/organizations", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          type: data.get("type"),
          coarseLocation: {
            stateRegion: data.get("stateRegion"),
            township: data.get("township"),
          },
          description: data.get("description"),
        }),
      });
      setStatus(t("organization.pending"));
      setShowCreate(false);
      form.reset();
      await loadData();
    } catch {
      setStatus(t("errors.offline"));
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingOrg) return;
    setEditBusy(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await apiRequest(`/organizations/${editingOrg.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: data.get("name"),
          type: data.get("type"),
          coarseLocation: {
            stateRegion: data.get("stateRegion"),
            township: data.get("township"),
          },
          description: data.get("description"),
        }),
      });
      setStatus(t("organization.updated"));
      setEditingOrg(null);
      await loadData();
    } catch {
      setStatus(t("errors.offline"));
    } finally {
      setEditBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deletingOrgId) return;
    setDeleteBusy(true);
    try {
      await apiRequest(`/organizations/${deletingOrgId}`, {
        method: "DELETE",
      });
      setStatus(t("organization.deleted"));
      setDeletingOrgId(null);
      setMemberships((current) => current.filter((m) => m.organizationId !== deletingOrgId));
    } catch {
      setStatus(t("errors.offline"));
    } finally {
      setDeleteBusy(false);
    }
  }

  async function verifyRequest(event: FormEvent<HTMLFormElement>, organizationId: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await apiRequest(`/requests/${data.get("requestId")}/verify`, {
        method: "POST",
        body: JSON.stringify({ organizationId }),
      });
      setStatus(t("request.success"));
      event.currentTarget.reset();
    } catch {
      setStatus(t("errors.unauthorized"));
    }
  }

  async function respondToMembership(organizationId: string, response: "ACCEPT" | "DECLINE") {
    try {
      await apiRequest(`/organizations/${organizationId}/members`, {
        method: "PATCH",
        body: JSON.stringify({ response }),
      });
      setMemberships((current) =>
        current.map((m) =>
          m.organizationId === organizationId
            ? { ...m, status: response === "ACCEPT" ? "ACTIVE" : "DECLINED" }
            : m,
        ),
      );
    } catch {
      setStatus(t("errors.unauthorized"));
    }
  }

  return (
    <div className="page-shell">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-heading">{t("organization.title")}</h1>
          <p className="section-sub">Manage your blood donation organizations, verifications & members</p>
        </div>
        <button
          className="button button-primary shrink-0 gap-2"
          onClick={() => setShowCreate((v) => !v)}
          id="create-org-btn"
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span>{t("organization.create")}</span>
        </button>
      </div>

      {status && (
        <p className="notice notice-info mb-5" role="status">
          {status}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-36 rounded-3xl" />
          <div className="skeleton h-36 rounded-3xl" />
        </div>
      ) : (
        <>
          {/* Membership / Organization cards */}
          {memberships.length > 0 && (
            <div className="mb-8 space-y-4">
              {memberships.map((m) => {
                const org = m.orgData;
                const isOwner = m.role === "OWNER";

                return (
                  <div key={m.organizationId} className="card p-5 sm:p-6 transition-all duration-200">
                    {m.status === "PENDING" ? (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-black">{t("organization.membershipPending")}</p>
                          <p className="mt-1 text-sm text-stone-500">
                            {org?.name ?? m.organizationId} · {m.role}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="button button-primary flex-1 sm:flex-none"
                            onClick={() => respondToMembership(m.organizationId, "ACCEPT")}
                            id={`accept-membership-${m.organizationId}`}
                          >
                            <Check className="h-4 w-4" aria-hidden />
                            {t("organization.acceptMembership")}
                          </button>
                          <button
                            className="button button-secondary flex-1 sm:flex-none"
                            onClick={() => respondToMembership(m.organizationId, "DECLINE")}
                            id={`decline-membership-${m.organizationId}`}
                          >
                            {t("organization.declineMembership")}
                          </button>
                        </div>
                      </div>
                    ) : m.status === "ACTIVE" ? (
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                                <Building2 className="h-5 w-5" aria-hidden />
                              </span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h2 className="font-black text-lg text-ink leading-tight">
                                    {org?.name ?? m.organizationId}
                                  </h2>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                      org?.verificationStatus === "VERIFIED"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                                  >
                                    {org?.verificationStatus ?? "PENDING"}
                                  </span>
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                                  <span className="font-semibold text-brand-700">Role: {m.role}</span>
                                  {org?.type && <span>· {org.type}</span>}
                                  {org?.coarseLocation && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {org.coarseLocation.township}, {org.coarseLocation.stateRegion}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Owner controls: Edit & Delete */}
                            {isOwner && org && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingOrg(org)}
                                  className="grid h-8 w-8 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 hover:text-brand-600"
                                  title={t("organization.edit")}
                                  id={`edit-org-${org.id}`}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingOrgId(org.id)}
                                  className="grid h-8 w-8 place-items-center rounded-xl border border-rose-200 bg-rose-50/50 text-rose-600 transition hover:bg-rose-100"
                                  title={t("organization.delete")}
                                  id={`delete-org-${org.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {org?.description && (
                            <p className="mt-3 text-xs text-stone-600 leading-relaxed max-w-xl">
                              {org.description}
                            </p>
                          )}

                          {/* Verify request form */}
                          <div className="mt-4 pt-4 border-t border-stone-100">
                            <p className="text-xs font-bold text-stone-500 mb-2">
                              {t("organization.verifyRequest")}
                            </p>
                            <form
                              className="flex flex-col gap-2 sm:flex-row max-w-md"
                              onSubmit={(e) => verifyRequest(e, m.organizationId)}
                            >
                              <input
                                className="field mt-0 flex-1 text-xs"
                                id={`request-${m.organizationId}`}
                                name="requestId"
                                placeholder={t("organization.requestId")}
                                required
                              />
                              <button
                                className="button button-secondary shrink-0 py-2 text-xs"
                                id={`verify-${m.organizationId}`}
                              >
                                {t("organization.verifyRequest")}
                              </button>
                            </form>
                          </div>
                        </div>

                        {/* Quick action links */}
                        <div className="flex shrink-0 flex-row gap-2 lg:flex-col pt-2 lg:pt-0">
                          <Link
                            className="button button-secondary flex-1 sm:flex-none text-xs gap-1.5"
                            href={`/organization/members?organizationId=${m.organizationId}`}
                            id={`members-${m.organizationId}`}
                          >
                            <Users className="h-3.5 w-3.5" aria-hidden />
                            <span>{t("organization.members")}</span>
                          </Link>
                          <Link
                            className="button button-primary flex-1 sm:flex-none text-xs gap-1.5"
                            href={`/requests/new?organizationId=${m.organizationId}`}
                            id={`new-request-${m.organizationId}`}
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                            <span>{t("dashboard.newRequest")}</span>
                          </Link>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Create org form — toggleable */}
          {(showCreate || memberships.length === 0) && (
            <div className="auth-card mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black">{t("organization.create")}</h2>
                {memberships.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitCreate}>
                <label className="label sm:col-span-2">
                  {t("organization.name")}
                  <input className="field" name="name" required id="org-name-input" />
                </label>
                <label className="label">
                  {t("organization.type")}
                  <select className="field" name="type" id="org-type-input">
                    {organizationTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  {t("request.stateRegion")}
                  <input className="field" name="stateRegion" required id="org-state-input" />
                </label>
                <label className="label">
                  {t("request.township")}
                  <input className="field" name="township" required id="org-township-input" />
                </label>
                <label className="label sm:col-span-2">
                  {t("organization.description")}
                  <textarea
                    className="field min-h-24"
                    name="description"
                    maxLength={500}
                    id="org-desc-input"
                  />
                </label>
                <button className="button button-primary sm:col-span-2" id="submit-org-btn">
                  {t("organization.create")}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* ─── Edit Organization Modal ─── */}
      {editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-ink">{t("organization.edit")}</h2>
              <button
                type="button"
                onClick={() => setEditingOrg(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={submitEdit}>
              <label className="label">
                {t("organization.name")}
                <input
                  className="field mt-1"
                  name="name"
                  defaultValue={editingOrg.name}
                  required
                />
              </label>

              <label className="label">
                {t("organization.type")}
                <select className="field mt-1" name="type" defaultValue={editingOrg.type}>
                  {organizationTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="label">
                  {t("request.stateRegion")}
                  <input
                    className="field mt-1"
                    name="stateRegion"
                    defaultValue={editingOrg.coarseLocation?.stateRegion ?? ""}
                    required
                  />
                </label>
                <label className="label">
                  {t("request.township")}
                  <input
                    className="field mt-1"
                    name="township"
                    defaultValue={editingOrg.coarseLocation?.township ?? ""}
                    required
                  />
                </label>
              </div>

              <label className="label">
                {t("organization.description")}
                <textarea
                  className="field mt-1 min-h-20"
                  name="description"
                  defaultValue={editingOrg.description ?? ""}
                  maxLength={500}
                />
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOrg(null)}
                  className="button button-secondary flex-1"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={editBusy}
                  className="button button-primary flex-1"
                >
                  {editBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deletingOrgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-black text-ink">{t("organization.delete")}</h2>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t("organization.deleteConfirm")}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingOrgId(null)}
                className="button button-secondary flex-1"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteBusy}
                className="button bg-rose-600 text-white hover:bg-rose-700 flex-1"
              >
                {deleteBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : t("organization.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrganizationPage() {
  return (
    <AuthGuard>
      <OrganizationWorkspace />
    </AuthGuard>
  );
}
