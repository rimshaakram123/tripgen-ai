import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/session";
import { getTravelDNA } from "@/services/travelDNAService";
import { getRestaurantRecommendations } from "@/services/restaurantService";
import { z } from "zod";

const schema = z.object({
  destination: z.string().min(2),
});

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const dna = await getTravelDNA(session!.user.id);

    if (!dna) {
      return NextResponse.json(
        { error: "Please complete your Travel DNA quiz first" },
        { status: 400 }
      );
    }

    const recommendations = await getRestaurantRecommendations(
      parsed.data.destination,
      dna
    );

    return NextResponse.json(recommendations);
  } catch (err) {
    console.error("RESTAURANT_RECOMMEND_ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
