"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { apiRequest } from "@/lib/api";

type Me = {
  email: string | null;
  profile: { displayName?: string; roles?: string[] } | null;
};

function ProfileView() {
  const { signOut } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    apiRequest<Me>("/me").then(setMe).catch(() => undefined);
  }, []);

  return (
    <section className="page-shell">
      <div className="card mx-auto max-w-xl p-6">
        <h1 className="text-3xl font-black">{t("nav.profile")}</h1>
        <dl className="mt-6 space-y-4 text-sm">
          <div><dt className="text-stone-500">{t("auth.name")}</dt><dd className="mt-1 font-bold">{me?.profile?.displayName}</dd></div>
          <div><dt className="text-stone-500">{t("auth.email")}</dt><dd className="mt-1 font-bold">{me?.email}</dd></div>
          <div><dt className="text-stone-500">{t("common.roles")}</dt><dd className="mt-1 font-bold">{me?.profile?.roles?.join(", ")}</dd></div>
        </dl>
        <button className="button button-secondary mt-6" onClick={async () => {
          await signOut();
          router.replace("/");
        }}>{t("common.signOut")}</button>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  return <AuthGuard><ProfileView /></AuthGuard>;
}
