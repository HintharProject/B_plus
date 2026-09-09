"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Mail, Lock, User, Chrome } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Brand } from "@/components/brand";

function LoginPage() {
  const { user, configured, signIn, register, signInWithGoogle, resetPassword } = useAuth();
  const { locale, t } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [router, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "register") {
        await register(
          String(data.get("name")),
          String(data.get("email")),
          String(data.get("password")),
          locale,
        );
      } else {
        await signIn(String(data.get("email")), String(data.get("password")));
      }
      router.push(mode === "register" ? "/verify-email" : "/dashboard");
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  }

  async function googleLogin() {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle(locale);
      router.push("/dashboard");
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Brand />
          <h1 className="mt-5 text-2xl font-black tracking-tight">
            {mode === "signin" ? t("auth.title") : t("auth.createAccount")}
          </h1>
          <p className="mt-2 text-sm text-stone-500">{t("auth.description")}</p>
        </div>

        {!configured && (
          <p className="notice notice-warning mb-5">{t("auth.configMissing")}</p>
        )}

        {/* Google — prominent, at top */}
        <button
          type="button"
          className="button button-secondary w-full gap-3 py-3 text-sm"
          onClick={googleLogin}
          disabled={!configured || loading}
          id="google-signin-btn"
        >
          {loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Chrome className="h-4 w-4 text-stone-500" aria-hidden />
          )}
          {t("auth.google")}
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-stone-100" />
          <span className="text-xs font-semibold text-stone-400">or</span>
          <span className="h-px flex-1 bg-stone-100" />
        </div>

        {/* Email form */}
        <form onSubmit={submit} className="auth-card space-y-4">
          {mode === "register" && (
            <label className="label">
              {t("auth.name")}
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
                <input
                  className="field pl-9"
                  name="name"
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  required
                  id="name-input"
                />
              </div>
            </label>
          )}

          <label className="label">
            {t("auth.email")}
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
              <input
                className="field pl-9"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="email-input"
              />
            </div>
          </label>

          <label className="label">
            {t("auth.password")}
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
              <input
                className="field pl-9"
                name="password"
                type="password"
                minLength={8}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
                id="password-input"
              />
            </div>
          </label>

          {error && (
            <p className="notice notice-warning" role="alert">{error}</p>
          )}

          <button
            className="button button-primary w-full py-3"
            disabled={!configured || loading}
            id="submit-btn"
          >
            {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
            {mode === "register" ? t("auth.createAccount") : t("auth.signIn")}
            {!loading && <ArrowRight className="h-4 w-4" aria-hidden />}
          </button>

          {mode === "signin" && (
            <button
              type="button"
              className="w-full text-center text-xs text-stone-400 underline-offset-2 hover:text-brand-700 hover:underline"
              disabled={!configured || !email}
              onClick={async () => {
                try {
                  await resetPassword(email);
                  setError(t("auth.resetSent"));
                } catch {
                  setError(t("auth.genericError"));
                }
              }}
              id="forgot-password-btn"
            >
              {t("auth.forgotPassword")}
            </button>
          )}
        </form>

        {/* Mode toggle */}
        <button
          className="mt-5 w-full text-center text-sm font-semibold text-brand-700 transition hover:text-brand-900"
          onClick={() => setMode(mode === "signin" ? "register" : "signin")}
          id="mode-toggle-btn"
        >
          {mode === "signin" ? t("auth.needAccount") : t("auth.haveAccount")} →
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
