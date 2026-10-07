import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/session";
import {
  modifyItineraryWithAI,
  RealPlacesUnavailableError,
} from "@/services/aiService";
import { getTripById, updateTrip } from "@/services/itineraryService";
import { getTravelDNA } from "@/services/travelDNAService";
import { getWeatherForecast } from "@/services/weatherService";

const modifySchema = z.object({
  instruction: z.string().trim().min(2).max(1000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const trip = await getTripById(id, session!.user.id);

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  if (!trip.itinerary) {
    return NextResponse.json(
      { error: "Generate an itinerary before asking AI to modify it" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = modifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid itinerary change request" },
      { status: 400 }
    );
  }

  const dna = await getTravelDNA(session!.user.id);
  const forecast = await getWeatherForecast(
    trip.destination,
    Math.max(1, trip.itinerary.totalDays)
  );

  try {
    const result = await modifyItineraryWithAI({
      itinerary: trip.itinerary,
      instruction: parsed.data.instruction,
      destination: trip.destination,
      budget: trip.budget ?? undefined,
      dna,
      weather: forecast.forecast,
    });

    const savedTrip = await updateTrip(id, session!.user.id, {
      itinerary: result.itinerary,
      status: "PLANNED",
    });

    return NextResponse.json({
      itinerary: result.itinerary,
      provider: result.provider,
      trip: savedTrip,
    });
  } catch (error) {
    if (error instanceof RealPlacesUnavailableError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: 503 }
      );
    }

    console.error("[TripGen AI] Itinerary modification failed", error);
    return NextResponse.json(
      { error: "Unable to safely modify this verified itinerary right now." },
      { status: 500 }
    );
  }
}
