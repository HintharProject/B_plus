"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, House, Map, UserRound } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/map", label: "Map", icon: Map },
  { href: "/workspace", label: "Org", icon: Building2 },
  { href: "/donor", label: "Donor", icon: UserRound },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden" aria-label="Mobile navigation">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 text-[11px] font-bold ${active ? "text-brand-600" : "text-stone-400"}`}>
              <span className={`grid h-7 w-10 place-items-center rounded-full ${active ? "bg-brand-50" : ""}`}>
                <Icon className="h-4 w-4" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
