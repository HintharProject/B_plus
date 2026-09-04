"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BellRing, Check, Info, LocateFixed, LockKeyhole, SlidersHorizontal } from "lucide-react";
import { candidates } from "@/data/demo";

function RadarPage() {
  const [selected, setSelected] = useState<string[]>(candidates.filter((item) => item.selected).map((item) => item.id));
  const [sent, setSent] = useState(false);

  function toggle(id: string) {
    setSent(false);
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/workspace" className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Request BR-1048</Link>
      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-bold text-brand-600">Anonymised outreach radar</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Who may be available nearby?</h1><p className="mt-3 max-w-2xl leading-7 text-stone-500">These are opted-in demo candidates—not clinical matches. Names, contact details and exact locations stay hidden.</p></div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-bold text-stone-600"><SlidersHorizontal className="h-4 w-4" /> Demo filters</button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-ink p-5 text-white"><p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Hospital request</p><p className="mt-2 text-2xl font-black">O+ · 2 units</p><p className="mt-1 text-xs text-stone-300">Yangon General Hospital</p></div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Broad search area</p><p className="mt-2 text-2xl font-black">10 km</p><p className="mt-1 text-xs text-stone-500">No exact GPS collected</p></div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Candidates shown</p><p className="mt-2 text-2xl font-black">{candidates.length}</p><p className="mt-1 text-xs text-stone-500">Demo availability signals</p></div>
      </div>

      <div className="mt-7 flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950"><Info className="mt-0.5 h-5 w-5 shrink-0" /><p>Blood type is a notification filter only. The hospital independently confirms blood type, eligibility and suitability before donation.</p></div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {candidates.map((candidate) => {
          const active = selected.includes(candidate.id);
          return (
            <button key={candidate.id} onClick={() => toggle(candidate.id)} className={`rounded-3xl border p-5 text-left transition ${active ? "border-brand-300 bg-brand-50/60 ring-2 ring-brand-100" : "border-stone-200 bg-white hover:border-brand-200"}`}>
              <div className="flex items-start justify-between">
                <div className="flex gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-lg font-black text-brand-700 shadow-sm">{candidate.bloodType}</span><div><p className="text-xs font-bold text-stone-400">{candidate.id}</p><h2 className="mt-0.5 font-black">{candidate.township}</h2></div></div>
                <span className={`grid h-6 w-6 place-items-center rounded-full ${active ? "bg-brand-600 text-white" : "border-2 border-stone-200"}`}>{active && <Check className="h-3.5 w-3.5" />}</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-stone-200/70 pt-4 text-xs">
                <span><LocateFixed className="mb-1 h-3.5 w-3.5 text-stone-400" /><strong className="block">{candidate.distance}</strong><small className="text-stone-400">distance band</small></span>
                <span><BellRing className="mb-1 h-3.5 w-3.5 text-stone-400" /><strong className="block">{candidate.availability}</strong><small className="text-stone-400">self-reported</small></span>
                <span><LockKeyhole className="mb-1 h-3.5 w-3.5 text-stone-400" /><strong className="block">{candidate.lastDonation}</strong><small className="text-stone-400">demo answer</small></span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-20 mt-7 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-card backdrop-blur md:bottom-4">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row"><p className="text-sm"><strong>{selected.length} selected</strong><span className="text-stone-500"> · contact remains hidden</span></p><button onClick={() => setSent(true)} disabled={!selected.length} className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-black text-white disabled:bg-stone-300 sm:w-auto">{sent ? "Demo invites sent" : `Notify ${selected.length} donor${selected.length === 1 ? "" : "s"}`}</button></div>
        {sent && <p className="mt-3 text-center text-xs font-semibold text-emerald-700 sm:text-right">Happy path simulated · <Link href="/invite/demo-8K2P" className="underline">open a donor invite</Link></p>}
      </div>
    </section>
  );
}

export default RadarPage;
