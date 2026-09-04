"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ChevronRight, CircleHelp, Clock3, Droplets, MapPin, ShieldCheck } from "lucide-react";
import { donorInvitations } from "@/data/demo";
import { UrgencyPill } from "@/components/urgency-pill";

function DonorPage() {
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("bplus-demo-availability");
    if (saved !== null) setAvailable(saved === "true");
  }, []);

  function toggleAvailability() {
    setAvailable((current) => {
      localStorage.setItem("bplus-demo-availability", String(!current));
      return !current;
    });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div><p className="text-sm font-bold text-brand-600">Donor dashboard</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Mingalaba, Ko Min Htet.</h1><p className="mt-2 text-stone-500">O+ · Sanchaung area · fictional profile</p></div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
        <div className="space-y-5">
          <article className={`rounded-3xl p-6 text-white shadow-sm transition ${available ? "bg-emerald-700" : "bg-stone-700"}`}>
            <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><Bell className="h-5 w-5" /></span><button onClick={toggleAvailability} role="switch" aria-checked={available} className={`relative h-7 w-12 rounded-full transition ${available ? "bg-white" : "bg-stone-500"}`}><span className={`absolute top-1 h-5 w-5 rounded-full transition ${available ? "left-6 bg-emerald-700" : "left-1 bg-white"}`} /></button></div>
            <h2 className="mt-6 text-2xl font-black">{available ? "Available for invites" : "Invites paused"}</h2>
            <p className="mt-2 text-sm leading-6 text-white/75">{available ? "Demo coordinators may include your anonymous profile in outreach." : "Your profile will not appear in new demo radar results."}</p>
            <p className="mt-5 text-xs font-bold text-white/60">Change anytime · saved only in this browser</p>
          </article>
          <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Droplets className="h-5 w-5" /></span><div><p className="text-xs text-stone-400">Self-reported last donation</p><p className="font-black">April 18 · demo date</p></div></div><p className="mt-4 text-xs leading-5 text-stone-500">This is not an eligibility check. Confirm with hospital staff before donating.</p></article>
        </div>

        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 p-5 sm:p-6"><h2 className="text-lg font-black">Your invitations</h2><p className="mt-1 text-xs text-stone-500">Respond privately before contact is shared</p></div>
          <div className="divide-y divide-stone-100">
            {donorInvitations.map((invite) => (
              <article key={invite.id} className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg font-black text-brand-700">{invite.bloodType}</span><div><h3 className="font-black">{invite.hospital}</h3><p className="mt-1 flex items-center gap-1 text-xs text-stone-500"><MapPin className="h-3 w-3" /> {invite.township} · <Clock3 className="ml-1 h-3 w-3" /> {invite.time}</p></div></div><UrgencyPill urgency={invite.urgency} /></div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5 text-xs"><span className="font-semibold text-stone-500">{invite.status}</span>{invite.status === "Awaiting response" && <Link href="/invite/demo-8K2P" className="flex items-center gap-1 font-black text-brand-700">Respond <ChevronRight className="h-3 w-3" /></Link>}</div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-stone-200 bg-white p-6"><ShieldCheck className="h-6 w-6 text-emerald-600" /><h2 className="mt-4 font-black">Who decides if I can donate?</h2><p className="mt-2 text-sm leading-6 text-stone-500">Only trained hospital staff can assess eligibility, type and screen blood, and advise you.</p></article>
        <article className="rounded-3xl border border-stone-200 bg-white p-6"><CircleHelp className="h-6 w-6 text-sky-600" /><h2 className="mt-4 font-black">Have a medical question?</h2><p className="mt-2 text-sm leading-6 text-stone-500">Ask the receiving hospital or Myanmar&apos;s National Blood Centre. B+ does not provide medical advice.</p></article>
      </div>
      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-stone-400"><CalendarDays className="h-3.5 w-3.5" /> All dates and invitations shown are fictional.</p>
    </section>
  );
}

export default DonorPage;
