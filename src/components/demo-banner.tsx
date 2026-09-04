import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-50 flex h-8 items-center justify-center gap-2 bg-ink px-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white">
      <FlaskConical className="h-3.5 w-3.5 text-brand-100" />
      Prototype · demo data · no real requests
    </div>
  );
}
