"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Check, Plus, Users } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";
import { organizationTypes } from "@/lib/domain";

type Membership = {
  organizationId: string;
  role: string;
  status: string;
};

function OrganizationWorkspace() {
  const { t } = useLocale();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    apiRequest<{ memberships: Membership[] }>("/me")
      .then((result) => setMemberships(result.memberships))
      .catch(() => setStatus(t("errors.offline")));
  }, [t]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const result = await apiRequest<{ organizationId: string }>("/organizations", {
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
      setMemberships((current) => [...current, {
        organizationId: result.organizationId,
        role: "OWNER",
        status: "ACTIVE",
      }]);
      setStatus(t("organization.pending"));
      setShowCreate(false);
      form.reset();
    } catch {
      setStatus(t("errors.offline"));
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
      setMemberships((current) => current.map((m) =>
        m.organizationId === organizationId
          ? { ...m, status: response === "ACCEPT" ? "ACTIVE" : "DECLINED" }
          : m,
      ));
    } catch {
      setStatus(t("errors.unauthorized"));
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="section-heading">{t("organization.title")}</h1>
          <p className="section-sub">Manage your verified blood donation organizations</p>
        </div>
        <button
          className="button button-primary shrink-0"
          onClick={() => setShowCreate((v) => !v)}
          id="create-org-btn"
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{t("organization.create")}</span>
        </button>
      </div>

      {status && (
        <p className="notice notice-info mb-5" role="status">{status}</p>
      )}

      {/* Membership cards */}
      {memberships.length > 0 && (
        <div className="mb-8 space-y-4">
          {memberships.map((m) => (
            <div key={m.organizationId} className="card p-5 sm:p-6">
              {m.status === "PENDING" ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black">{t("organization.membershipPending")}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {m.organizationId} · {m.role}
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
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <Building2 className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <p className="font-black leading-tight">{m.organizationId}</p>
                        <p className="text-xs text-stone-500">{m.role}</p>
                      </div>
                    </div>
                    {/* Verify request inline form */}
                    <form
                      className="mt-4 flex flex-col gap-2 sm:flex-row"
                      onSubmit={(e) => verifyRequest(e, m.organizationId)}
                    >
                      <label className="sr-only" htmlFor={`request-${m.organizationId}`}>
                        {t("organization.requestId")}
                      </label>
                      <input
                        className="field mt-0 flex-1"
                        id={`request-${m.organizationId}`}
                        name="requestId"
                        placeholder={t("organization.requestId")}
                        required
                      />
                      <button className="button button-secondary shrink-0" id={`verify-${m.organizationId}`}>
                        {t("organization.verifyRequest")}
                      </button>
                    </form>
                  </div>
                  {/* Quick action buttons */}
                  <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                    <Link
                      className="button button-secondary flex-1 sm:flex-none"
                      href={`/organization/members?organizationId=${m.organizationId}`}
                      id={`members-${m.organizationId}`}
                    >
                      <Users className="h-4 w-4" aria-hidden />
                      <span className="hidden sm:inline">{t("organization.members")}</span>
                    </Link>
                    <Link
                      className="button button-primary flex-1 sm:flex-none"
                      href={`/requests/new?organizationId=${m.organizationId}`}
                      id={`new-request-${m.organizationId}`}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      <span className="hidden sm:inline">{t("dashboard.newRequest")}</span>
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Create org form — toggleable */}
      {(showCreate || memberships.length === 0) && (
        <div className="auth-card">
          <h2 className="mb-5 text-lg font-black">{t("organization.create")}</h2>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
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
              <textarea className="field min-h-24" name="description" maxLength={500} id="org-desc-input" />
            </label>
            <button className="button button-primary sm:col-span-2" id="submit-org-btn">
              {t("organization.create")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function OrganizationPage() {
  return <AuthGuard><OrganizationWorkspace /></AuthGuard>;
}
