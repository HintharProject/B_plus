import Link from "next/link";
import { ArrowRight, Info, MapPinned } from "lucide-react";
import { HospitalMap } from "@/components/hospital-map";
import { hospitals } from "@/data/demo";
import { UrgencyPill } from "@/components/urgency-pill";

function MapPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-bold text-brand-600">Public demo map</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Blood needs around Yangon</h1><p className="mt-3 max-w-2xl leading-7 text-stone-500">Fictional hospital requests for presentation only. Contact a hospital directly for current, verified information.</p></div>
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-brand-50 px-3 py-2 text-xs font-black text-brand-700"><span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" /> {hospitals.length} demo pins</div>
      </div>

      <div className="mt-7"><HospitalMap /></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="flex gap-3 rounded-3xl bg-ink p-6 text-sm leading-6 text-stone-300"><Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-100" /><p><strong className="text-white">Before you travel:</strong> confirm directly with the hospital. B+ does not guarantee that a request is current or that anyone is eligible to donate.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {hospitals.map((hospital) => (
            <article key={hospital.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">{hospital.need}</span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-black">{hospital.name}</h2><p className="mt-1 text-xs text-stone-500">{hospital.township} · demo need</p></div><UrgencyPill urgency={hospital.urgency} /></article>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl border border-red-100 bg-brand-50 p-6 text-center sm:flex-row sm:text-left"><div className="flex items-center gap-3"><MapPinned className="hidden h-7 w-7 text-brand-600 sm:block" /><div><h2 className="font-black">Representing a verified community group?</h2><p className="mt-1 text-sm text-stone-600">Explore the fictional coordinator workflow.</p></div></div><Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white">Open workspace <ArrowRight className="h-4 w-4" /></Link></div>
    </section>
  );
}

export default MapPage;
