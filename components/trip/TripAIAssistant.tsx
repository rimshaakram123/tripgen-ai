"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, CloudRain, DollarSign, Mountain, Send, Sparkles, Utensils, Wand2, Wifi, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import AIMessageContent from "@/components/ui/AIMessageContent";
import { useAssistant } from "@/hooks/useAssistant";
import type { Trip } from "@/types/trip";

type AIStatus = {
  primary: "openrouter";
  enabled: boolean;
  available: boolean;
  activeProvider: "openrouter" | null;
  model: string;
  openrouter: { configured: boolean; available: boolean; model: string; freeMode: boolean };
  fallbackEnabled: boolean;
};

const quickEdits = [
  { label: "Make cheaper", instruction: "Make the itinerary noticeably cheaper while preserving the best experiences. Prefer free or low-cost activities and affordable local food.", icon: DollarSign },
  { label: "More local food", instruction: "Add more authentic local food experiences across the itinerary without making the schedule too crowded.", icon: Utensils },
  { label: "More outdoors", instruction: "Make the itinerary more outdoorsy with nature, scenic walks, viewpoints, or light adventure where weather allows.", icon: Mountain },
  { label: "Adapt to weather", instruction: "Adapt the itinerary to the available weather forecast. Replace unsuitable outdoor activities on bad-weather days with strong indoor alternatives.", icon: CloudRain },
];

export default function TripAIAssistant({ trip }: { trip: Trip }) {
  const router = useRouter();
  const { messages, loading: chatting, sendMessage, clear } = useAssistant();
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [input, setInput] = useState("");
  const [modifying, setModifying] = useState(false);
  const [activeQuickEdit, setActiveQuickEdit] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/ai/status", { cache: "no-store" }).then(res => res.json()).then((data:AIStatus)=>{ if(mounted) setStatus(data); }).catch(()=>{if(mounted)setStatus(null)});
    return ()=>{mounted=false};
  },[]);

  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTo({top:scrollRef.current.scrollHeight,behavior:"smooth"}); },[messages,chatting]);

  const tripContext = useMemo(() => JSON.stringify({ destination: trip.destination, dates:{start:trip.startDate,end:trip.endDate}, budget:trip.budget, currency:trip.currency, itinerary:trip.itinerary }), [trip]);

  async function askAI(event?:FormEvent){event?.preventDefault();const message=input.trim();if(!message||chatting)return;setInput("");await sendMessage(message,tripContext)}

  async function modifyItinerary(instruction:string, quickLabel?:string){
    if(!trip.itinerary){toast.error("Generate an itinerary first");return;}
    setModifying(true);setActiveQuickEdit(quickLabel??"custom");const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),100_000);
    try{const res=await fetch(`/api/trips/${trip.id}/modify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({instruction}),signal:controller.signal});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error??"Failed to modify itinerary");toast.success(data.provider==="fallback"?"Updated with verified-place fallback":"Updated with OpenRouter AI");router.refresh();}
    catch(error){toast.error(error instanceof Error&&error.name==="AbortError"?"AI update took too long. Please retry.":error instanceof Error?error.message:"Failed to modify itinerary");}
    finally{clearTimeout(timeout);setModifying(false);setActiveQuickEdit(null);}
  }

  async function applyCustomEdit(){const instruction=input.trim();if(!instruction){toast.error("Tell TripGen what you want to change");return;}setInput("");await modifyItinerary(instruction)}

  return (
    <section className="glass-panel overflow-hidden rounded-[30px]">
      <div className="border-b border-white/8 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet/25 to-cyan/15 text-cyan"><Bot size={21}/></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-white">TripGen Copilot</h3>{status?.available?<span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-success"><Wifi size={11}/> OpenRouter online</span>:<span className="inline-flex items-center gap-1.5 rounded-full border border-warning/20 bg-warning/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-warning"><WifiOff size={11}/> AI offline</span>}</div><p className="mt-1 text-xs text-gray-soft">{status?.available?`Free AI routing · ${status.model}`:"Your saved itinerary stays safe; retry when AI is available."}</p></div></div>
          {messages.length>0&&<button type="button" onClick={clear} className="text-xs text-gray-soft transition hover:text-white">Clear conversation</button>}
        </div>
      </div>

      <div className="grid gap-2 border-b border-white/8 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">{quickEdits.map(({label,instruction,icon:Icon})=><button key={label} type="button" disabled={!trip.itinerary||modifying} onClick={()=>modifyItinerary(instruction,label)} className="group flex items-center gap-2.5 rounded-2xl border border-white/8 bg-white/[.025] px-3.5 py-3 text-left text-sm text-gray-soft transition hover:border-cyan/20 hover:bg-white/[.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"><Icon size={15} className="shrink-0 text-cyan"/><span>{modifying&&activeQuickEdit===label?"Updating…":label}</span></button>)}</div>

      <div ref={scrollRef} aria-live="polite" className="max-h-[360px] min-h-[180px] space-y-3 overflow-y-auto bg-[#080e1c]/45 p-4 sm:p-5">
        {messages.length===0&&!chatting?<div className="flex h-40 flex-col items-center justify-center text-center"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet/10 text-violet-hover"><Sparkles size={18}/></div><p className="mt-3 text-sm font-semibold text-white">Ask about this trip</p><p className="mt-1 max-w-sm text-xs leading-5 text-gray-soft">Try “what should I do first?”, “make it less touristy”, or “is this budget realistic?”</p></div>:null}
        <AnimatePresence initial={false}>{messages.map((message,index)=><motion.div key={`${message.role}-${index}`} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`flex ${message.role==="user"?"justify-end":"justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role==="user"?"rounded-br-md bg-gradient-to-r from-violet/25 to-violet/15 text-white":"rounded-bl-md border border-white/8 bg-white/[.035] text-gray-soft"}`}><AIMessageContent content={message.content}/></div></motion.div>)}</AnimatePresence>
        {chatting&&<div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/8 bg-white/[.035] px-4 py-3 text-sm text-gray-soft"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan"/> TripGen is thinking…</div></div>}
      </div>

      <form onSubmit={askAI} className="p-4 sm:p-5"><textarea value={input} onChange={e=>setInput(e.target.value)} rows={3} placeholder='Ask naturally, or describe an edit…' className="w-full resize-none rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3.5 text-sm text-white placeholder:text-gray-soft/50 focus:border-cyan/40 focus:outline-none focus:ring-4 focus:ring-cyan/5"/><div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] text-gray-soft">AI can advise anytime. Editing unlocks after an itinerary exists.</p><div className="flex gap-2 sm:justify-end"><Button type="submit" variant="secondary" size="sm" disabled={!input.trim()||chatting||modifying}><span className="flex items-center gap-2"><Send size={14}/> Ask AI</span></Button><Button type="button" size="sm" loading={modifying&&activeQuickEdit==="custom"} disabled={!trip.itinerary||!input.trim()||chatting} onClick={applyCustomEdit}><span className="flex items-center gap-2"><Wand2 size={14}/> Apply edit</span></Button></div></div></form>
    </section>
  );
}
