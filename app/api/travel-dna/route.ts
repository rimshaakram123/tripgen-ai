import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { saveTravelDNA } from "@/services/travelDNAService";
import type { TravelDNA } from "@/types/travelDNA";

const dnaSchema = z.object({
  adventure: z.number().min(0).max(100),
  culture: z.number().min(0).max(100),
  food: z.number().min(0).max(100),
  nature: z.number().min(0).max(100),
  photography: z.number().min(0).max(100),
  relaxation: z.number().min(0).max(100),
  nightlife: z.number().min(0).max(100),
  budget: z.number().min(0).max(100),
});

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const dna = await prisma.travelDNA.findUnique({
    where: { userId: session!.user.id },
  });

  return NextResponse.json({ dna });
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = dnaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid DNA data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await saveTravelDNA(
      session!.user.id,
      parsed.data as TravelDNA
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("TRAVEL_DNA_SAVE_ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
