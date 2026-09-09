"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";

export function AuthGuard({
  children,
  requireVerifiedEmail = true,
}: {
  children: React.ReactNode;
  requireVerifiedEmail?: boolean;
}) {
  const { user, loading, configured } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (configured && !loading && !user) router.replace("/login");
  }, [configured, loading, router, user]);

  if (!configured) {
    return <div className="notice notice-warning">{t("auth.configMissing")}</div>;
  }
  if (loading || !user) {
    return <div className="py-16 text-center text-sm text-stone-500">{t("common.loading")}</div>;
  }
  if (requireVerifiedEmail && !user.emailVerified) {
    return (
      <div className="card mx-auto max-w-lg p-6 text-center">
        <p>{t("auth.verifyEmail")}</p>
        <Link className="button button-primary mt-4" href="/verify-email">
          {t("common.continue")}
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
