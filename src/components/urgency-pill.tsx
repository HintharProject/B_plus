import type { Urgency } from "@/lib/domain";

const config: Record<Urgency, { pill: string; dot: string; label: string }> = {
  CRITICAL: {
    pill: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
    label: "Critical",
  },
  URGENT: {
    pill: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    label: "Urgent",
  },
  STANDARD: {
    pill: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
    label: "Standard",
  },
};

export function UrgencyPill({ urgency }: { urgency: Urgency }) {
  const { pill, dot, label } = config[urgency];
  return (
    <span
      className={`status-chip ${pill}`}
      aria-label={`Urgency: ${label}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dot} ${urgency === "CRITICAL" ? "animate-pulse" : ""}`}
        aria-hidden
      />
      {label}
    </span>
  );
}
