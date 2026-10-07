import { prisma } from "@/lib/prisma";
import type { Trip, CreateTripInput, UpdateTripInput } from "@/types/trip";
import type { Itinerary } from "@/types/itinerary";

export async function createTrip(
  userId: string,
  input: CreateTripInput
): Promise<Trip> {
  const trip = await prisma.trip.create({
    data: {
      userId,
      destination: input.destination,
      description: input.description ?? null,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      budget: input.budget ?? null,
      currency: input.currency ?? "USD",
      coverImage: input.coverImage ?? null,
      status: "DRAFT",
    },
  });

  return serializeTrip(trip);
}

export async function getTripsByUser(userId: string): Promise<Trip[]> {
  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return trips.map(serializeTrip);
}

export async function getTripById(
  id: string,
  userId: string
): Promise<Trip | null> {
  const trip = await prisma.trip.findFirst({
    where: { id, userId },
  });

  if (!trip) return null;

  return serializeTrip(trip);
}

export async function updateTrip(
  id: string,
  userId: string,
  input: UpdateTripInput
): Promise<Trip | null> {
  const data: Record<string, unknown> = {};

  if (input.destination !== undefined) data.destination = input.destination;
  if (input.description !== undefined) data.description = input.description;
  if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
  if (input.budget !== undefined) data.budget = input.budget;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage;
  if (input.status !== undefined) data.status = input.status;
  if (input.itinerary !== undefined) data.itinerary = input.itinerary as object;

  const trip = await prisma.trip.update({
    where: { id, userId },
    data,
  });

  return serializeTrip(trip);
}

export async function deleteTrip(
  id: string,
  userId: string
): Promise<boolean> {
  const trip = await prisma.trip.deleteMany({
    where: { id, userId },
  });

  return trip.count > 0;
}

export async function updateItinerary(
  tripId: string,
  userId: string,
  itinerary: Itinerary
): Promise<Trip | null> {
  return updateTrip(tripId, userId, { itinerary });
}

function serializeTrip(trip: unknown): Trip {
  const t = trip as Record<string, unknown>;
  return {
    id: t.id as string,
    userId: t.userId as string,
    destination: t.destination as string,
    description: (t.description as string) ?? null,
    startDate: (t.startDate as Date).toISOString(),
    endDate: (t.endDate as Date).toISOString(),
    budget: (t.budget as number) ?? null,
    currency: (t.currency as string) ?? "USD",
    coverImage: (t.coverImage as string) ?? null,
    status: (t.status as string) as Trip["status"],
    itinerary: (t.itinerary as Itinerary) ?? null,
    createdAt: (t.createdAt as Date).toISOString(),
    updatedAt: (t.updatedAt as Date).toISOString(),
  };
}
