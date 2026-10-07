import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/session";
import { getTripById } from "@/services/itineraryService";
import { calculateBudget, optimizeBudget } from "@/services/budgetService";
import { z } from "zod";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const trip = await getTripById(id, session!.user.id);

  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const summary = await calculateBudget(trip);

  return NextResponse.json({ summary });
}

const optimizeSchema = z.object({
  targetBudget: z.number().positive(),
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

  try {
    const body = await req.json();
    const parsed = optimizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const result = await optimizeBudget(trip, parsed.data.targetBudget);

    return NextResponse.json(result);
  } catch (err) {
    console.error("BUDGET_OPTIMIZE_ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
