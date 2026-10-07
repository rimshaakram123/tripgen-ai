import Link from "next/link";
import { Compass, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/8 bg-[#060a14]/80 py-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-cyan"><Compass size={19} className="text-white" /></div>
            <div><p className="font-bold text-white">TripGen AI</p><p className="text-xs text-gray-soft">Travel that adapts to you.</p></div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-6 text-gray-soft">Personalized trip planning powered by your Travel DNA, verified real places, live conditions, and a flexible AI copilot.</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Explore</p>
          <div className="mt-4 grid gap-3 text-sm text-gray-soft"><Link href="/#features" className="hover:text-white">Features</Link><Link href="/#how" className="hover:text-white">How it works</Link><Link href="/#dna" className="hover:text-white">Travel DNA</Link></div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Built with</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-soft"><span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">OpenRouter</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">OpenStreetMap</span><span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">Supabase</span></div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/8 px-6 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p>© 2026 TripGen AI. Crafted for smarter journeys.</p>
        <p className="flex items-center gap-1.5"><Sparkles size={12} className="text-cyan" /> AI suggestions should be verified before travel.</p>
      </div>
    </footer>
  );
}
