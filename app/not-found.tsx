import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-midnight px-6">
      <div className="glass-panel w-full max-w-xl rounded-[32px] p-8 text-center sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan/10 text-cyan"><Compass size={24}/></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-cyan">404 · Off route</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white">This stop is not on the map.</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-soft">The page may have moved or the trip no longer exists. Head back to your travel workspace.</p>
        <Link href="/dashboard" className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet to-cyan px-5 py-3 text-sm font-semibold text-white">Go to dashboard <ArrowRight size={15}/></Link>
      </div>
    </main>
  );
}
