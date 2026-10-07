import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/session";
import { getTripById } from "@/services/itineraryService";
import {
  generateItinerary,
  RealPlacesUnavailableError,
} from "@/services/aiService";
import { getTravelDNA } from "@/services/travelDNAService";
import { getWeatherForecast } from "@/services/weatherService";

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

  const dna = await getTravelDNA(session!.user.id);

  if (!dna) {
    return NextResponse.json(
      { error: "Please complete your Travel DNA quiz first" },
      { status: 400 }
    );
  }

  const days =
    Math.floor(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  const weatherForecast = await getWeatherForecast(trip.destination, days);

  try {
    const itinerary = await generateItinerary({
      destination: trip.destination,
      startDate: trip.startDate,
      days: Math.max(1, days),
      budget: trip.budget ?? undefined,
      dna,
      weather: weatherForecast.forecast,
    });

    return NextResponse.json({ itinerary });
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

    console.error("[TripGen AI] Itinerary generation failed", error);
    return NextResponse.json(
      { error: "Unable to generate a verified itinerary right now. Please try again." },
      { status: 500 }
    );
  }
}
