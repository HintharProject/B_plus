import type { Urgency } from "@/data/demo";

const styles: Record<Urgency, string> = {
  CRITICAL: "bg-red-100 text-red-700 ring-red-200",
  URGENT: "bg-amber-100 text-amber-800 ring-amber-200",
  STANDARD: "bg-sky-100 text-sky-700 ring-sky-200",
};

export function UrgencyPill({ urgency }: { urgency: Urgency }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black tracking-wider ring-1 ring-inset ${styles[urgency]}`}>
      {urgency}
    </span>
  );
}
