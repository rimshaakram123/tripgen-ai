import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAuth } from "@/lib/session";
import { createTrip, getTripsByUser } from "@/services/itineraryService";

const createTripSchema = z
  .object({
    destination: z.string().trim().min(2, "Destination is required").max(200),
    description: z.string().trim().max(1000).optional(),
    startDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid start date"),
    endDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid end date"),
    budget: z.number().positive().optional(),
    currency: z.string().trim().max(10).optional(),
    coverImage: z.string().trim().max(2000).optional(),
  })
  .refine((value) => new Date(value.endDate) > new Date(value.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine((value) => {
    const days = Math.floor((new Date(value.endDate).getTime() - new Date(value.startDate).getTime()) / 86_400_000) + 1;
    return days <= 14;
  }, {
    message: "Trips can be up to 14 days for AI planning",
    path: ["endDate"],
  });

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const trips = await getTripsByUser(session!.user.id);

  return NextResponse.json({ trips });
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const parsed = createTripSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid trip data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const trip = await createTrip(session!.user.id, parsed.data);

    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    console.error("CREATE_TRIP_ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
