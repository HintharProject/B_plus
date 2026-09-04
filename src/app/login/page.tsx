"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CircleUserRound, HeartHandshake, LoaderCircle } from "lucide-react";
import { demoAccounts } from "@/data/demo";

const icons = [Building2, HeartHandshake, CircleUserRound];

function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  function chooseAccount(account: (typeof demoAccounts)[number]) {
    setLoading(account.role);
    localStorage.setItem("bplus-demo-session", JSON.stringify({ role: account.role, name: account.name }));
    window.setTimeout(() => router.push(account.href), 450);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-brand-700">No password needed</span>
        <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Choose a demo account</h1>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-stone-500">These fictional profiles let you explore each prototype path. Nothing is sent or saved outside this browser.</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
        {demoAccounts.map((account, index) => {
          const Icon = icons[index];
          const isLoading = loading === account.role;
          return (
            <button key={account.role} onClick={() => chooseAccount(account)} disabled={loading !== null} className="group rounded-3xl border border-stone-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card disabled:opacity-60">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></span>
              <p className="mt-6 text-xs font-black uppercase tracking-widest text-brand-600">{account.role}</p>
              <h2 className="mt-1 text-xl font-black">{account.name}</h2>
              <p className="mt-2 min-h-10 text-sm leading-5 text-stone-500">{account.detail}</p>
              <span className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4 text-sm font-bold text-ink">
                Open account
                {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mx-auto mt-8 max-w-2xl rounded-2xl bg-amber-50 p-4 text-center text-xs leading-5 text-amber-900">
        Prototype only: this is not authentication and must not be used with real personal or health information.
      </p>
    </section>
  );
}

export default LoginPage;
