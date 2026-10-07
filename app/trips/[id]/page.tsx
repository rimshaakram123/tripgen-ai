import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, DollarSign, MapPin, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Badge from "@/components/ui/Badge";
import AmbientBackground from "@/components/ui/AmbientBackground";
import ItineraryView from "@/components/trip/ItineraryView";
import TripActions from "@/components/trip/TripActions";
import TripAIAssistant from "@/components/trip/TripAIAssistant";
import { getAuthSession } from "@/lib/session";
import { getTripById } from "@/services/itineraryService";

function countDays(start:string,end:string){return Math.floor((new Date(end).getTime()-new Date(start).getTime())/86_400_000)+1}

export default async function TripDetailPage({params}:{params:Promise<{id:string}>}){
  const session=await getAuthSession(); if(!session?.user?.id) redirect("/login");
  const {id}=await params; const trip=await getTripById(id,session.user.id); if(!trip) redirect("/dashboard");
  const days=Math.max(1,countDays(trip.startDate,trip.endDate));
  return <main className="relative min-h-screen"><AmbientBackground/><Navbar/><div className="mx-auto max-w-7xl px-6 pb-20 pt-28 lg:px-8">
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-soft transition hover:text-white"><ArrowLeft size={15}/> Back to dashboard</Link>
    <section className="gradient-border glass-panel relative mt-5 overflow-hidden rounded-[34px] p-6 sm:p-8"><div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan/8 blur-[90px]"/><div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-black capitalize tracking-[-.04em] text-white sm:text-4xl">{trip.destination}</h1><Badge variant={trip.status==="ACTIVE"?"success":trip.status==="PLANNED"?"cyan":"default"}>{trip.status}</Badge>{trip.itinerary?.grounding?.validated&&<span className="rounded-full border border-success/20 bg-success/8 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-success">verified itinerary</span>}</div><div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-soft"><span className="flex items-center gap-2"><MapPin size={15} className="text-cyan"/>{trip.destination}</span><span className="flex items-center gap-2"><CalendarDays size={15} className="text-cyan"/>{new Date(trip.startDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})} – {new Date(trip.endDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>{trip.budget&&<span className="flex items-center gap-2"><DollarSign size={15} className="text-cyan"/>{trip.budget} {trip.currency}</span>}</div></div><div className="flex gap-3"><div className="rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-center"><p className="text-2xl font-black text-white">{days}</p><p className="text-[10px] uppercase tracking-[.14em] text-gray-soft">days</p></div><div className="rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-center"><p className="text-2xl font-black text-cyan">{trip.itinerary?.days.reduce((n,d)=>n+d.activities.length,0)??0}</p><p className="text-[10px] uppercase tracking-[.14em] text-gray-soft">stops</p></div></div></div></section>
    <div className="mt-5"><TripActions trip={trip} userId={session.user.id}/></div>
    <div className="mt-5 grid gap-6 xl:grid-cols-[1.45fr_.75fr]"><div className="order-2 xl:order-1">{trip.itinerary?<ItineraryView itinerary={trip.itinerary}/>:<div className="glass-panel flex min-h-[340px] flex-col items-center justify-center rounded-[30px] px-6 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet/20 to-cyan/15 text-cyan"><Sparkles size={24}/></div><h2 className="mt-5 text-2xl font-black text-white">Your itinerary canvas is empty</h2><p className="mt-3 max-w-md text-sm leading-6 text-gray-soft">Generate a grounded itinerary to unlock day-by-day planning, AI edits and real-place verification.</p></div>}</div><div className="order-1 xl:order-2 xl:sticky xl:top-28 xl:self-start"><TripAIAssistant trip={trip}/></div></div>
  </div><Footer/></main>
}
