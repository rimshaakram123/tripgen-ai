import { prisma } from "@/lib/prisma";
import type { TravelDNA, DNADimension } from "@/types/travelDNA";
import { getPersonalityType } from "@/lib/travelDNAUtils";

export async function saveTravelDNA(
  userId: string,
  dna: TravelDNA
): Promise<{ id: string; personality: string }> {
  const personality = getPersonalityType(dna);

  const record = await prisma.travelDNA.upsert({
    where: { userId },
    create: {
      userId,
      ...dna,
      personality: personality.type,
    },
    update: {
      ...dna,
      personality: personality.type,
    },
  });

  return { id: record.id, personality: personality.type };
}

export async function getTravelDNA(
  userId: string
): Promise<TravelDNA | null> {
  const record = await prisma.travelDNA.findUnique({
    where: { userId },
  });

  if (!record) return null;

  const {
    adventure,
    culture,
    food,
    nature,
    photography,
    relaxation,
    nightlife,
    budget,
    personality,
  } = record;

  return {
    adventure,
    culture,
    food,
    nature,
    photography,
    relaxation,
    nightlife,
    budget,
    personality: personality ?? undefined,
  };
}

export function getDNABarData(dna: TravelDNA) {
  const dims: { key: DNADimension; label: string; value: number }[] = [
    { key: "adventure", label: "Adventure", value: dna.adventure },
    { key: "culture", label: "Culture", value: dna.culture },
    { key: "food", label: "Food", value: dna.food },
    { key: "nature", label: "Nature", value: dna.nature },
    { key: "photography", label: "Photography", value: dna.photography },
    { key: "relaxation", label: "Relaxation", value: dna.relaxation },
    { key: "nightlife", label: "Nightlife", value: dna.nightlife },
    { key: "budget", label: "Budget", value: dna.budget },
  ];

  return dims.sort((a, b) => b.value - a.value);
}
