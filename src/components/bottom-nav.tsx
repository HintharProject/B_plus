"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Droplets, HandHeart, House } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const items = [
    { href: "/", label: t("nav.home"), icon: House },
    { href: "/requests", label: t("nav.requests"), icon: Droplets },
    { href: "/matches", label: t("nav.matches"), icon: HandHeart },
    { href: "/organizations", label: t("nav.organizations"), icon: Building2 },
  ];

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
      role="navigation"
      aria-label={t("nav.mobileLabel")}
    >
      {/* Floating pill container */}
      <nav className="flex items-center gap-1 rounded-2xl border border-white/80 bg-white/90 px-2 py-2 shadow-[0_8px_32px_rgba(37,28,29,0.14)] backdrop-blur-xl">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-bold transition-all duration-200 ${
                active
                  ? "bg-brand-600 text-white shadow-glow-sm"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
              <span className={active ? "opacity-100" : "opacity-75"}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
