import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/session";
import { getGroundedPlaces } from "@/services/placeService";
import { getTravelDNA } from "@/services/travelDNAService";

export async function GET(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const destination = searchParams.get("destination")?.trim();
  const requestedLimit = Number(searchParams.get("limit") || 24);
  const limit = Math.min(48, Math.max(8, Number.isFinite(requestedLimit) ? requestedLimit : 24));

  if (!destination || destination.length < 2) {
    return NextResponse.json(
      { error: "A destination query is required" },
      { status: 400 }
    );
  }

  const dna = await getTravelDNA(session!.user.id);
  const result = await getGroundedPlaces(destination, dna, limit);

  return NextResponse.json({
    destination,
    center: result.center,
    count: result.places.length,
    places: result.places,
    diagnostics: result.diagnostics,
    attribution: "© OpenStreetMap contributors",
  });
}
