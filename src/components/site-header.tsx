import Link from "next/link";
import { MapPinned } from "lucide-react";
import { Brand } from "@/components/brand";

const nav = [
  { href: "/map", label: "Live needs" },
  { href: "/workspace", label: "Org workspace" },
  { href: "/donor", label: "For donors" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-red-100 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-semibold text-stone-600 transition hover:text-brand-700">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/map" className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 text-stone-600 md:hidden" aria-label="View map">
            <MapPinned className="h-5 w-5" />
          </Link>
          <Link href="/login" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700">
            Demo login
          </Link>
        </div>
      </div>
    </header>
  );
}
