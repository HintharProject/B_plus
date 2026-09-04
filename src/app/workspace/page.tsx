import Link from "next/link";
import { ArrowRight, BellRing, CheckCircle2, Clock3, Plus, Radio, UsersRound } from "lucide-react";
import { demoRequests, roster } from "@/data/demo";
import { UrgencyPill } from "@/components/urgency-pill";

function WorkspacePage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-bold text-brand-600">Coordinator workspace</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Good morning, Thiri.</h1><p className="mt-2 text-stone-500">Yangon Community Blood Network · fictional organisation</p></div>
        <Link href="/requests/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-700"><Plus className="h-4 w-4" /> New request</Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Radio, value: "2", label: "Active requests", tone: "text-brand-600 bg-brand-50" },
          { icon: UsersRound, value: "148", label: "Opted-in donors", tone: "text-violet-600 bg-violet-50" },
          { icon: CheckCircle2, value: "38", label: "Available today", tone: "text-emerald-600 bg-emerald-50" },
          { icon: Clock3, value: "12m", label: "Avg. demo reply", tone: "text-amber-600 bg-amber-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return <article key={stat.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"><span className={`grid h-9 w-9 place-items-center rounded-xl ${stat.tone}`}><Icon className="h-4 w-4" /></span><p className="mt-4 text-2xl font-black">{stat.value}</p><p className="mt-1 text-xs font-semibold text-stone-500">{stat.label}</p></article>;
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 p-5 sm:p-6"><div><h2 className="text-lg font-black">Demo requests</h2><p className="mt-1 text-xs text-stone-500">No patient full names are shown</p></div><BellRing className="h-5 w-5 text-brand-500" /></div>
          <div className="divide-y divide-stone-100">
            {demoRequests.map((request) => (
              <article key={request.id} className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg font-black text-brand-700">{request.bloodType}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{request.hospital}</h3><UrgencyPill urgency={request.urgency} /></div><p className="mt-1 text-xs text-stone-500">{request.id} · Patient {request.initials} · {request.units} unit{request.units > 1 ? "s" : ""}</p></div></div>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-stone-600">{request.status}</span>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-xs"><span className="text-stone-500">{request.accepted} accepted · {request.invited} invited</span>{request.status === "Inviting" && <Link href="/radar" className="flex items-center gap-1 font-black text-brand-700">Open radar <ArrowRight className="h-3 w-3" /></Link>}</div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Roster today</h2><p className="mt-1 text-xs text-stone-500">Demo availability</p></div><UsersRound className="h-5 w-5 text-violet-500" /></div>
          <div className="mt-5 space-y-4">
            {roster.map((donor) => (
              <div key={donor.name} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-stone-100 text-xs font-black">{donor.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{donor.name}</p><p className="text-xs text-stone-500">{donor.bloodType} · {donor.township}</p></div><span className={`h-2.5 w-2.5 rounded-full ${donor.availability === "Paused" ? "bg-stone-300" : "bg-emerald-500"}`} /></div>
            ))}
          </div>
          <button className="mt-6 w-full rounded-xl border border-stone-200 py-2.5 text-sm font-bold text-stone-600">View demo roster</button>
        </div>
      </div>
    </section>
  );
}

export default WorkspacePage;
