"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CloudRain, DollarSign, RefreshCw, Sparkles, Utensils } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import type { Trip } from "@/types/trip";

export default function TripActions({ trip }: { trip: Trip; userId: string }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  async function generateItinerary() {
    if (generating || editing) return;
    setGenerating(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 110_000);
    try {
      const res = await fetch(`/api/trips/${trip.id}/generate`, { method: "POST", signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to generate itinerary");
      const updateRes = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary: data.itinerary, status: "PLANNED" }),
      });
      if (!updateRes.ok) throw new Error("Itinerary was generated but could not be saved");
      toast.success(data.itinerary?.grounding?.validated ? "Verified itinerary ready" : "Itinerary ready");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error && error.name === "AbortError" ? "Generation timed out. Try again in a moment." : error instanceof Error ? error.message : "Failed to generate itinerary");
    } finally {
      clearTimeout(timeout);
      setGenerating(false);
    }
  }

  async function quickEdit(label: string, instruction: string) {
    if (!trip.itinerary || generating || editing) return;
    setEditing(label);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 100_000);
    try {
      const res = await fetch(`/api/trips/${trip.id}/modify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update itinerary");
      toast.success(data.provider === "fallback" ? `${label} applied with verified-place fallback` : `${label} applied with OpenRouter AI`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error && error.name === "AbortError" ? "Update timed out. Try again." : error instanceof Error ? error.message : "Failed to update itinerary");
    } finally {
      clearTimeout(timeout);
      setEditing(null);
    }
  }

  const secondary = [
    ["Weather adaptation", "Adapt the itinerary to the available weather forecast and replace unsuitable outdoor activities on bad-weather days with strong indoor alternatives.", CloudRain, "Adapt weather"],
    ["Food upgrade", "Add more authentic local food experiences and restaurant-style meal stops while keeping the itinerary balanced and within budget.", Utensils, "More local food"],
    ["Budget optimization", "Make the itinerary cheaper while preserving its best experiences. Prefer free attractions, public spaces, affordable local food, and lower-cost alternatives.", DollarSign, "Make cheaper"],
  ] as const;

  return (
    <section className="glass-panel rounded-[28px] p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-gray-soft">AI controls</p>
          <h3 className="mt-1 text-lg font-bold text-white">Shape this trip</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={generateItinerary} loading={generating} disabled={editing !== null} size="sm">
            <span className="flex items-center gap-2">{trip.itinerary ? <RefreshCw size={15}/> : <Sparkles size={15}/>} {trip.itinerary ? "Regenerate" : "Generate itinerary"}</span>
          </Button>
          {secondary.map(([label,instruction,Icon,buttonLabel]) => (
            <Button key={label} variant="secondary" size="sm" disabled={!trip.itinerary || editing !== null || generating} onClick={() => quickEdit(label,instruction)}>
              <span className="flex items-center gap-2"><Icon size={15}/>{editing===label?"Updating…":buttonLabel}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
