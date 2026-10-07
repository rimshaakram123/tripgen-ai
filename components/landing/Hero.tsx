"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Brain, MapPin, Sparkles, Wand2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pt-36 lg:pb-32 lg:pt-44">
      <div className="absolute inset-0 -z-10"><div className="app-grid absolute inset-0 opacity-70"/><div className="animate-glow absolute left-1/2 top-20 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-violet/20 blur-[150px]"/><div className="animate-floaty absolute right-[4%] top-[20%] h-72 w-72 rounded-full bg-cyan/10 blur-[120px]"/></div>
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8">
        <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{duration:.7,ease:[.22,1,.36,1]}}>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan"><Sparkles size={14}/> Personalized travel intelligence</div>
          <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-[5.3rem]">Trips that feel <span className="text-gradient">made for you.</span></h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-gray-soft sm:text-xl">TripGen combines your Travel DNA, verified real places, weather and AI to build journeys that adapt instead of staying static.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet via-violet-hover to-cyan px-6 py-3.5 font-semibold text-white shadow-[0_16px_50px_rgba(124,58,237,.3)] transition hover:-translate-y-1">Build my trip <ArrowRight size={17}/></Link>
            <Link href="/#how" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] px-6 py-3.5 font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07]">See how it works</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-gray-soft"><span className="flex items-center gap-2"><BadgeCheck size={16} className="text-success"/> Real-place grounded</span><span className="flex items-center gap-2"><Brain size={16} className="text-violet-hover"/> Travel DNA personalization</span><span className="flex items-center gap-2"><Wand2 size={16} className="text-cyan"/> Adaptive AI copilot</span></div>
        </motion.div>

        <motion.div initial={{opacity:0,x:40,scale:.97}} animate={{opacity:1,x:0,scale:1}} transition={{duration:.85,delay:.1,ease:[.22,1,.36,1]}} className="relative">
          <div className="gradient-border glass-panel relative overflow-hidden rounded-[34px] p-4 shadow-[0_35px_120px_rgba(0,0,0,.42)] sm:p-5">
            <div className="rounded-[27px] border border-white/8 bg-[#0a1020] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.2em] text-cyan">Example trip canvas</p><h3 className="mt-2 text-2xl font-bold tracking-tight text-white">Riyadh, Saudi Arabia</h3><p className="mt-1 text-sm text-gray-soft">3 days · Culture + food + nature</p></div><span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-semibold text-success">Grounded demo</span></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">{[["Day 1","Diriyah","Culture"],["Day 2","King Salman Park","Nature"],["Day 3","Local dining","Food"]].map(([day,place,type],i)=><motion.div key={day} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.55+i*.12}} className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"><p className="text-[11px] uppercase tracking-[.17em] text-slate-500">{day}</p><p className="mt-3 text-sm font-semibold text-white">{place}</p><p className="mt-1 text-xs text-gray-soft">{type}</p></motion.div>)}</div>
              <div className="mt-4 rounded-2xl border border-violet/15 bg-gradient-to-r from-violet/10 to-cyan/5 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-white"><Sparkles size={16} className="text-cyan"/> Copilot insight</div><p className="mt-2 text-sm leading-6 text-gray-soft">“Rain is likely tomorrow afternoon. I moved outdoor stops to the morning and kept the cultural cluster nearby.”</p></div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 text-xs text-gray-soft"><span className="flex items-center gap-2"><MapPin size={14} className="text-cyan"/> Verified places</span><span>Travel DNA match 92%</span></div>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-white/10 bg-[#0d1529]/95 p-4 shadow-2xl backdrop-blur-xl sm:block"><p className="text-[10px] uppercase tracking-[.18em] text-gray-soft">Smart budget</p><p className="mt-1 text-lg font-bold text-white">$184 <span className="text-xs font-normal text-success">under target</span></p></div>
        </motion.div>
      </div>
    </section>
  );
}
