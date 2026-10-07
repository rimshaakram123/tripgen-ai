import type { TravelDNA, DNAPersonalityType, DNADimension } from "@/types/travelDNA";

export function calculateDNA(
  answers: { category: DNADimension }[]
): TravelDNA {
  const scores: Record<DNADimension, number> = {
    adventure: 0,
    culture: 0,
    food: 0,
    nature: 0,
    photography: 0,
    relaxation: 0,
    nightlife: 0,
    budget: 0,
  };

  for (const answer of answers) {
    scores[answer.category] += 1;
  }

  const total = answers.length || 1;
  const dimensions: DNADimension[] = [
    "adventure", "culture", "food", "nature",
    "photography", "relaxation", "nightlife", "budget",
  ];

  for (const dim of dimensions) {
    scores[dim] = Math.round((scores[dim] / total) * 100);
  }

  return scores as TravelDNA;
}

export function getPersonalityType(dna: TravelDNA): DNAPersonalityType {
  const entries = (Object.entries(dna) as [string, number][])
    .filter(([k]) => k !== "personality")
    .sort((a, b) => b[1] - a[1]) as [DNADimension, number][];

  const topTraits = entries.slice(0, 3).map(([dim]) => dim);

  const personalities: Record<string, DNAPersonalityType> = {
    "adventure-culture-food": {
      type: "The Bold Explorer",
      description:
        "You crave adrenaline, culture and cuisine in equal measure. Every trip is a full-spectrum adventure.",
      primaryTraits: ["adventure", "culture", "food"],
    },
    "culture-food-photography": {
      type: "The Culture Explorer",
      description:
        "You immerse yourself in local traditions, flavors and visual storytelling. Every destination is a canvas.",
      primaryTraits: ["culture", "food", "photography"],
    },
    "nature-relaxation-photography": {
      type: "The Serene Wanderer",
      description:
        "You seek tranquility in nature, capturing beauty at a calm, deliberate pace. Travel is your reset button.",
      primaryTraits: ["nature", "relaxation", "photography"],
    },
    "adventure-nature-photography": {
      type: "The Trailblazer",
      description:
        "Mountains, trails and untouched landscapes call your name. You document every wild moment.",
      primaryTraits: ["adventure", "nature", "photography"],
    },
    "food-nightlife-culture": {
      type: "The Urban Socialite",
      description:
        "You thrive in the energy of cities — fine dining, nightlife and cultural events keep you moving.",
      primaryTraits: ["food", "nightlife", "culture"],
    },
    "adventure-food-budget": {
      type: "The Smart Adventurer",
      description:
        "You maximize every dollar for maximum adventure. Budget-savvy without sacrificing the thrill.",
      primaryTraits: ["adventure", "food", "budget"],
    },
  };

  const key = topTraits.join("-");
  const match = personalities[key];

  if (match) return match;

  // Build a dynamic personality from top traits
  const traitNames: Record<DNADimension, string> = {
    adventure: "Adventurer",
    culture: "Culturalist",
    food: "Foodie",
    nature: "Naturalist",
    photography: "Photographer",
    relaxation: "Relaxer",
    nightlife: "Nightlife Lover",
    budget: "Budget Strategist",
  };

  return {
    type: `The ${traitNames[topTraits[0]]}`,
    description: `Your travel personality is defined by ${topTraits
      .map((t) => traitNames[t].toLowerCase())
      .join(", ")}. You have a unique blend that makes every trip distinctly yours.`,
    primaryTraits: topTraits,
  };
}
