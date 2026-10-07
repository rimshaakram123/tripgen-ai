"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-midnight px-6">
      <div className="glass-panel w-full max-w-xl rounded-[32px] p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger"><AlertTriangle size={24}/></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-danger">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white">TripGen hit an unexpected error.</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-soft">Your saved trip data is unaffected. Retry the page, or return to the dashboard and continue from there.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet to-cyan px-5 py-3 text-sm font-semibold text-white"><RefreshCw size={15}/> Try again</button><Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3 text-sm font-semibold text-slate-200">Dashboard</Link></div>
      </div>
    </main>
  );
}
