import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-2" aria-label="B+ home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-lg font-black text-white shadow-sm transition group-hover:-rotate-3">
        B+
      </span>
      <span className="hidden text-sm font-extrabold tracking-tight text-ink sm:block">
        Every type counts.
      </span>
    </Link>
  );
}
