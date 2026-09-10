"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";

export function SiteHeader() {
  const { user } = useAuth();
  const { t } = useLocale();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { href: "/organizations", label: t("nav.organizations") },
    { href: "/requests", label: t("nav.requests") },
    { href: "/matches", label: t("nav.matches") },
    { href: "/profile", label: t("nav.profile") },
  ];

  // Detect scroll to switch header style
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "border-b border-stone-100 bg-cream/95 shadow-[0_1px_24px_rgba(37,28,29,0.07)] backdrop-blur-xl"
            : "border-b border-transparent bg-cream/70 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <Brand />

          {/* Desktop nav — centered */}
          <nav
            className="hidden items-center md:flex"
            aria-label={t("nav.mainLabel")}
          >
            <div className="flex items-center gap-0.5 rounded-2xl border border-stone-100 bg-white/70 px-1.5 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-xl px-4 py-1.5 text-sm font-semibold transition-all duration-150 ${
                    isActive(item.href)
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <Link
              href={user ? "/dashboard" : "/login"}
              className="button button-primary gap-2 px-4 py-2 text-sm shadow-glow-sm"
              id="header-cta"
            >
              {user ? (
                <>
                  <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden sm:inline">{t("dashboard.title")}</span>
                </>
              ) : (
                <span>{t("nav.login")}</span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="ml-1 grid h-9 w-9 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              id="mobile-menu-btn"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[60px] z-30 border-b border-stone-100 bg-cream/98 px-4 pb-5 pt-3 shadow-lg backdrop-blur-xl md:hidden">
          <div className="mb-3 block sm:hidden">
            <LanguageSwitcher />
          </div>
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-stone-700 hover:bg-stone-50"
                }`}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
