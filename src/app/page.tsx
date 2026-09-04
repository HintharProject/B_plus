import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, HeartHandshake, Hospital, LockKeyhole, Radio, ShieldCheck, UserRoundCheck } from "lucide-react";

const steps = [
  { icon: Building2, title: "A coordinator verifies the need", text: "A trusted local group records the hospital, requested type, units and timing." },
  { icon: Radio, title: "Opted-in donors are notified", text: "B+ helps the group reach available donors without exposing names or phone numbers." },
  { icon: UserRoundCheck, title: "Contact follows consent", text: "Only after a donor accepts can the coordinator share the demo contact details." },
  { icon: Hospital, title: "The hospital takes over", text: "Hospital staff type, screen, approve and collect every donation." },
];

function LandingPage() {
  return (
    <>
      <section className="overflow-hidden border-b border-red-100 bg-[radial-gradient(circle_at_85%_20%,#ffe0e0_0,transparent_35%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-28">
          <div>
            <p className="mb-5 font-extrabold text-brand-700">B+ is for every blood type.</p>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.045em] text-ink sm:text-6xl">
              Faster donor outreach, coordinated by people you trust.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
              B+ helps verified Myanmar charities and community groups notify opted-in donors. It is a coordinator—not a blood bank—and never replaces hospital screening.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-brand-700">
                Enter the demo <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/map" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3.5 text-sm font-bold text-ink shadow-sm hover:border-brand-200">
                See demo needs
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-stone-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> All 8 blood types</span>
              <span className="flex items-center gap-1.5"><LockKeyhole className="h-4 w-4 text-emerald-600" /> Consent before contact</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Demo data only</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-4 rotate-3 rounded-[2rem] bg-brand-100" />
            <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-card sm:p-7">
              <div className="flex items-start justify-between border-b border-stone-100 pb-5">
                <div><p className="text-xs font-bold uppercase tracking-widest text-brand-600">Demo request</p><h2 className="mt-1 text-xl font-black">Yangon General Hospital</h2></div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-[10px] font-black text-red-700">CRITICAL</span>
              </div>
              <div className="grid grid-cols-3 gap-3 py-6">
                {[["O+", "TYPE"], ["2", "UNITS"], ["Today", "WHEN"]].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-stone-50 p-4 text-center"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-[9px] font-bold tracking-widest text-stone-400">{label}</p></div>
                ))}
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                <strong>1 donor accepted.</strong> Contact is now visible to the coordinator for this demo.
              </div>
              <p className="mt-5 text-xs leading-5 text-stone-500">Hospital staff confirm donor eligibility and blood compatibility. B+ does not make clinical decisions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-600">How it works</p>
        <h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">Community coordination, with clear boundaries.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return <article key={step.title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span><span className="text-xs font-black text-stone-300">0{index + 1}</span></div><h3 className="mt-5 font-black">{step.title}</h3><p className="mt-2 text-sm leading-6 text-stone-500">{step.text}</p></article>;
          })}
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div><HeartHandshake className="h-10 w-10 text-brand-100" /><h2 className="mt-5 text-3xl font-black">Built for local partners first.</h2><p className="mt-4 max-w-lg leading-7 text-stone-300">The fictional Yangon Community Blood Network uses B+ to manage its opted-in roster and coordinate with hospitals. Individual requests stay pending until a coordinator verifies them.</p></div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6"><LockKeyhole className="h-7 w-7 text-brand-100" /><h3 className="mt-4 text-xl font-black">Privacy by default</h3><p className="mt-3 leading-7 text-stone-300">Radar cards show only blood type, broad township area and distance band. No exact GPS, patient full names, donor names or phone numbers appear before acceptance.</p></div>
        </div>
      </section>
    </>
  );
}

export default LandingPage;
