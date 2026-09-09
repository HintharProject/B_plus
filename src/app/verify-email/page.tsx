"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";

export default function VerifyEmailPage() {
  const { user, resendVerification, signOut } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function refresh() {
    await user?.reload();
    if (user?.emailVerified) router.replace("/dashboard");
    else setMessage(t("auth.verifyEmail"));
  }

  return (
    <section className="page-shell">
      <div className="card mx-auto max-w-lg p-6 text-center">
        <h1 className="text-2xl font-black">{t("auth.verifyEmail")}</h1>
        <p className="mt-3 text-sm text-stone-500">{user?.email}</p>
        {message ? <p className="notice notice-info mt-4" role="status">{message}</p> : null}
        <div className="mt-6 flex flex-col gap-3">
          <button className="button button-primary" onClick={refresh}>{t("common.continue")}</button>
          <button className="button button-secondary" onClick={async () => {
            await resendVerification();
            setMessage(t("auth.verifyEmail"));
          }}>{t("common.retry")}</button>
          <button className="text-sm font-bold text-stone-500 underline" onClick={async () => {
            await signOut();
            router.replace("/login");
          }}>{t("common.signOut")}</button>
        </div>
      </div>
    </section>
  );
}
