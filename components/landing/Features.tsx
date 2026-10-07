import { Brain, CloudSun, MapPinned, MessageCircleMore, Route, WalletCards } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

const features = [
  [Brain,"Travel DNA","A preference profile that shapes every recommendation instead of giving everyone the same trip."],
  [MapPinned,"Verified places","Recommendations are grounded in mapped real-world places before AI can use them."],
  [MessageCircleMore,"AI Copilot","Ask naturally, refine a day, make it cheaper, or shift the balance toward food, culture or outdoors."],
  [CloudSun,"Weather-aware","Weather becomes planning context, not just a forecast card."],
  [WalletCards,"Budget intelligence","TripGen keeps activity spend visible and helps rebalance plans around your target."],
  [Route,"Geographic clustering","Daily stops are grouped to reduce unnecessary back-and-forth across a city."],
] as const;

export default function Features(){
  return <section id="features" className="relative py-24 sm:py-32"><div className="mx-auto max-w-7xl px-6 lg:px-8"><Reveal className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan">One adaptive workspace</p><h2 className="mt-4 text-4xl font-black tracking-[-.04em] text-white sm:text-5xl">Less tab-hopping. More actual travel planning.</h2><p className="mt-5 text-lg leading-8 text-gray-soft">Every layer of TripGen is designed to inform the next one—from who you are as a traveler to which real places fit the day.</p></Reveal><div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{features.map(([Icon,title,text],i)=><Reveal key={title} delay={i*.05}><div className="group h-full rounded-[28px] border border-white/8 bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan/20 hover:bg-white/[0.055]"><div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet/18 to-cyan/12 text-cyan transition group-hover:scale-105"><Icon size={21}/></div><h3 className="mt-5 text-xl font-bold text-white">{title}</h3><p className="mt-3 leading-7 text-gray-soft">{text}</p></div></Reveal>)}</div></div></section>
}
