"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Droplets, Hospital, LockKeyhole, MapPin, Phone, ShieldCheck, XCircle } from "lucide-react";
import { UrgencyPill } from "@/components/urgency-pill";

type Response = "accepted" | "declined" | null;

function InvitePage() {
  const [response, setResponse] = useState<Response>(null);

  return (
    <section className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-card sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-6"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Private demo invitation</p><h1 className="mt-2 text-2xl font-black tracking-tight">Could you donate O+ blood?</h1></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg font-black text-brand-700">O+</span></div>

        <div className="space-y-4 py-6">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-stone-50"><Hospital className="h-5 w-5 text-stone-500" /></span><div><p className="text-xs text-stone-400">Hospital</p><p className="text-sm font-black">Yangon General Hospital</p></div></div>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-stone-50"><MapPin className="h-5 w-5 text-stone-500" /></span><div><p className="text-xs text-stone-400">Area</p><p className="text-sm font-black">Lanmadaw Township</p></div></div>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-stone-50"><CalendarClock className="h-5 w-5 text-stone-500" /></span><div><p className="text-xs text-stone-400">Requested time</p><p className="text-sm font-black">Today · before 3:00 PM</p></div></div>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-stone-50"><Droplets className="h-5 w-5 text-stone-500" /></span><div><p className="text-xs text-stone-400">Hospital-stated urgency</p><UrgencyPill urgency="CRITICAL" /></div></div>
        </div>

        {!response && (
          <>
            <div className="flex gap-3 rounded-2xl bg-sky-50 p-4 text-xs leading-5 text-sky-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p>Accepting means you agree to be contacted by the demo coordinator. It does not confirm eligibility; hospital staff make that decision.</p></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={() => setResponse("accepted")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-black text-white"><CheckCircle2 className="h-4 w-4" /> Accept invitation</button><button onClick={() => setResponse("declined")} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 px-5 py-3.5 text-sm font-black text-stone-600"><XCircle className="h-4 w-4" /> Decline privately</button></div>
          </>
        )}

        {response === "accepted" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><CheckCircle2 className="h-8 w-8 text-emerald-700" /><h2 className="mt-3 text-xl font-black text-emerald-950">Thank you for accepting.</h2><p className="mt-2 text-sm leading-6 text-emerald-900">Your demo contact is now shared with the coordinator. Their fictional contact is revealed below.</p><div className="mt-4 rounded-xl bg-white p-4"><p className="text-xs font-bold text-stone-400">DEMO COORDINATOR</p><p className="mt-1 font-black">Thiri Win · Yangon Community Blood Network</p><p className="mt-2 flex items-center gap-2 text-sm font-bold text-brand-700"><Phone className="h-4 w-4" /> +95 9 000 000 208 (fictional)</p></div></div>
        )}

        {response === "declined" && (
          <div className="rounded-2xl bg-stone-100 p-5"><LockKeyhole className="h-7 w-7 text-stone-500" /><h2 className="mt-3 text-xl font-black">Invitation declined privately.</h2><p className="mt-2 text-sm leading-6 text-stone-500">No contact details were revealed. The coordinator only sees that you are unavailable for this request.</p><button onClick={() => setResponse(null)} className="mt-4 text-sm font-black text-brand-700 underline">Change demo response</button></div>
        )}
      </div>
      <p className="mt-5 text-center text-xs leading-5 text-stone-400">B+ coordinates outreach only. Ask the hospital or National Blood Centre for medical guidance.</p>
      <Link href="/donor" className="mt-4 block text-center text-sm font-bold text-brand-700">Go to donor dashboard</Link>
    </section>
  );
}

export default InvitePage;
