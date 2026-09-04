"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { hospitals, type BloodType, type Urgency } from "@/data/demo";

const bloodTypes: BloodType[] = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"];
const urgencies: Urgency[] = ["CRITICAL", "URGENT", "STANDARD"];

function NewRequestPage() {
  const [individual, setIndividual] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bloodType, setBloodType] = useState<BloodType>("O+");

  useEffect(() => setIndividual(new URLSearchParams(window.location.search).get("from") === "individual"), []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-8 w-8" /></span>
        <p className="mt-6 text-sm font-black uppercase tracking-widest text-emerald-700">Demo request BR-1049 created</p>
        <h1 className="mt-2 text-3xl font-black">{individual ? "Sent for coordinator review" : "Ready to find opted-in donors"}</h1>
        <p className="mt-4 leading-7 text-stone-500">{individual ? "Individual submissions cannot notify donors until a fictional coordinator verifies the hospital need." : "Candidate identities remain hidden on radar. The hospital is responsible for eligibility and screening."}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!individual && <Link href="/radar" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-bold text-white">Open anonymised radar <ArrowRight className="h-4 w-4" /></Link>}
          <Link href={individual ? "/" : "/workspace"} className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-bold">Return {individual ? "home" : "to workspace"}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href={individual ? "/login" : "/workspace"} className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <div className="mt-6">
        <p className="text-sm font-bold text-brand-600">{individual ? "Individual help request" : "Coordinator workspace"}</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Create a demo request</h1>
        <p className="mt-3 max-w-2xl leading-7 text-stone-500">Record only what a coordinator needs. Do not enter a patient&apos;s full name, phone, diagnosis, or other health information.</p>
      </div>

      {individual && <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><p><strong>Verification required.</strong> This demo request cannot reach donors until a fictional coordinator checks it with the hospital.</p></div>}

      <form onSubmit={submit} className="mt-8 space-y-6 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
        <label className="block"><span className="text-sm font-black">Hospital</span><select required className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none ring-brand-100 focus:ring-4">{hospitals.map((hospital) => <option key={hospital.id}>{hospital.name}</option>)}</select><span className="mt-2 flex items-center gap-1.5 text-xs text-stone-400"><Building2 className="h-3.5 w-3.5" /> Demo Yangon hospitals only</span></label>

        <fieldset><legend className="text-sm font-black">Requested blood type</legend><div className="mt-3 grid grid-cols-4 gap-2">{bloodTypes.map((type) => <button type="button" key={type} onClick={() => setBloodType(type)} className={`rounded-xl py-3 text-sm font-black ring-1 ring-inset transition ${bloodType === type ? "bg-brand-600 text-white ring-brand-600" : "bg-stone-50 text-stone-600 ring-stone-200 hover:ring-brand-200"}`}>{type}</button>)}</div></fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label><span className="text-sm font-black">Units requested</span><select className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-brand-100"><option>1 unit</option><option>2 units</option><option>3 units</option><option>4 units</option></select></label>
          <label><span className="text-sm font-black">Patient initials (optional)</span><input maxLength={4} placeholder="e.g. M.T." className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm uppercase outline-none placeholder:normal-case focus:ring-4 focus:ring-brand-100" /><span className="mt-1.5 block text-xs text-stone-400">Never enter a full name</span></label>
        </div>

        <fieldset><legend className="text-sm font-black">Urgency stated by hospital</legend><div className="mt-3 grid gap-2 sm:grid-cols-3">{urgencies.map((urgency, index) => <label key={urgency} className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 text-sm font-bold"><input type="radio" name="urgency" defaultChecked={index === 1} value={urgency} className="accent-brand-600" />{urgency}</label>)}</div></fieldset>

        <div className="flex gap-3 rounded-xl bg-sky-50 p-4 text-xs leading-5 text-sky-900"><Info className="mt-0.5 h-4 w-4 shrink-0" /><p>B+ does not determine blood compatibility or donor eligibility. Hospital staff must type, screen and approve the donor.</p></div>
        <button className="w-full rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-black text-white shadow-sm hover:bg-brand-700">{individual ? "Submit for coordinator review" : "Create request and open radar"}</button>
      </form>
    </section>
  );
}

export default NewRequestPage;
