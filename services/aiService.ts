import { z } from "zod";

import type { TravelDNA } from "@/types/travelDNA";
import type {
  Itinerary,
  ItineraryDay,
  ItineraryActivity,
  ActivityCategory,
} from "@/types/itinerary";
import type { WeatherData } from "@/types/weather";
import type { DestinationCenter, GroundedPlace } from "@/types/place";
import { aiChat, type AIProviderName } from "@/services/aiProviderService";
import { parseAIJson } from "@/lib/aiJson";
import {
  compactPlacesForPrompt,
  getGroundedPlaces,
  OSM_ATTRIBUTION,
} from "@/services/placeService";
import {
  hydrateActivityFromPlace,
  validateGroundedItinerary,
} from "@/services/itineraryValidator";

type GenerateInput = {
  destination: string;
  startDate: string;
  days: number;
  budget?: number;
  dna: TravelDNA;
  weather?: WeatherData[];
};

type ModifyItineraryInput = {
  itinerary: Itinerary;
  instruction: string;
  destination: string;
  budget?: number;
  dna?: TravelDNA | null;
  weather?: WeatherData[];
};

export type ModifyItineraryResult = {
  itinerary: Itinerary;
  provider: AIProviderName | "fallback";
};

export class RealPlacesUnavailableError extends Error {
  readonly code = "REAL_PLACES_UNAVAILABLE";

  constructor(
    message: string,
    public readonly details?: {
      destination?: string;
      found?: number;
      required?: number;
      broadDestination?: boolean;
      warnings?: string[];
    }
  ) {
    super(message);
    this.name = "RealPlacesUnavailableError";
  }
}

const groundedActivitySchema = z.object({
  placeId: z.string().min(3),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  description: z.string().min(2).max(220),
  duration: z.string().max(40).optional(),
});

const groundedDaySchema = z.object({
  day: z.number().int().positive(),
  date: z.string(),
  theme: z.string().max(80).optional(),
  activities: z.array(groundedActivitySchema).min(1).max(4),
  notes: z.string().max(220).optional(),
});

const groundedItinerarySchema = z.object({
  days: z.array(groundedDaySchema).min(1),
  weatherAdaptations: z.array(z.string()).optional(),
});

const timeSlots = ["09:00", "13:00", "17:30", "20:00"];

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function placeDistanceKm(a: GroundedPlace, b: GroundedPlace): number {
  const earthRadius = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function buildGeographicDayBuckets(
  places: GroundedPlace[],
  days: number,
  activitiesPerDay: number
): GroundedPlace[][] {
  if (!places.length || days <= 0) return [];

  const ranked = [...places].sort((a, b) => b.score - a.score);
  const seedPool = ranked.slice(0, Math.min(ranked.length, Math.max(12, days * 5)));
  const seedCount = Math.min(days, seedPool.length);
  const seeds: GroundedPlace[] = [seedPool[0]];

  while (seeds.length < seedCount) {
    const next = seedPool
      .filter((place) => !seeds.some((seed) => seed.id === place.id))
      .map((place) => {
        const nearestSeed = Math.min(...seeds.map((seed) => placeDistanceKm(place, seed)));
        return { place, value: nearestSeed + place.score * 0.035 };
      })
      .sort((a, b) => b.value - a.value)[0]?.place;
    if (!next) break;
    seeds.push(next);
  }

  const buckets = seeds.map((seed) => [seed]);
  while (buckets.length < days) buckets.push([]);
  const used = new Set(seeds.map((seed) => seed.id));

  for (let dayIndex = 0; dayIndex < buckets.length; dayIndex++) {
    const bucket = buckets[dayIndex];
    while (bucket.length < activitiesPerDay) {
      const anchorPlace = bucket[bucket.length - 1] ?? seeds[dayIndex] ?? ranked[0];
      const categories = new Set(bucket.map((place) => place.category));
      const candidate = ranked
        .filter((place) => !used.has(place.id))
        .map((place) => {
          const distance = placeDistanceKm(anchorPlace, place);
          const diversityBonus = categories.has(place.category) ? 0 : 2.5;
          // Quality/DNA still matters, but same-day proximity is the dominant factor.
          const value = place.score * 0.08 + diversityBonus - distance * 1.25;
          return { place, value };
        })
        .sort((a, b) => b.value - a.value)[0]?.place;
      if (!candidate) break;
      bucket.push(candidate);
      used.add(candidate.id);
    }
  }

  return buckets;
}

function formatDayBucketsForPrompt(buckets: GroundedPlace[][]): string {
  return buckets
    .map((bucket, index) => `DAY ${index + 1} REAL-PLACE CLUSTER:\n${compactPlacesForPrompt(bucket)}`)
    .join("\n\n");
}

function buildWeatherContext(weather?: WeatherData[]): string {
  if (!weather?.length) return "No weather forecast is available.";
  return weather
    .map(
      (day, index) =>
        `Day ${index + 1} (${day.date}): ${day.condition}, ${day.description}, ${Math.round(day.temperature)}°C`
    )
    .join("\n");
}

function buildDnaContext(dna: TravelDNA): string {
  return [
    `Adventure ${dna.adventure}/100`,
    `Culture ${dna.culture}/100`,
    `Food ${dna.food}/100`,
    `Nature ${dna.nature}/100`,
    `Photography ${dna.photography}/100`,
    `Relaxation ${dna.relaxation}/100`,
    `Nightlife ${dna.nightlife}/100`,
    `Budget-conscious ${dna.budget}/100`,
    dna.personality ? `Personality: ${dna.personality}` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function recalculateItinerary(itinerary: Itinerary): Itinerary {
  const days = itinerary.days.map((day, dayIndex) => {
    const activities = day.activities.map((activity, activityIndex) => ({
      ...activity,
      id: activity.id || `activity-${dayIndex + 1}-${activityIndex + 1}`,
    }));
    const totalCost = activities.reduce(
      (sum, activity) => sum + (activity.estimatedCost ?? 0),
      0
    );
    return { ...day, day: dayIndex + 1, activities, totalCost };
  });

  return {
    ...itinerary,
    totalDays: days.length,
    totalCost: days.reduce((sum, day) => sum + (day.totalCost ?? 0), 0),
    days,
    generatedAt: new Date().toISOString(),
  };
}

function buildGroundedItinerary(args: {
  destination: string;
  startDate: string;
  days: number;
  parsed: z.infer<typeof groundedItinerarySchema>;
  places: GroundedPlace[];
  center: DestinationCenter | null;
  budget?: number;
  existingDates?: string[];
  dayBuckets?: GroundedPlace[][];
}): Itinerary {
  const { destination, startDate, days, parsed, places, center, budget, existingDates, dayBuckets } = args;
  if (parsed.days.length !== days) {
    throw new Error(`AI returned ${parsed.days.length} days; expected ${days}`);
  }

  const placeMap = new Map(places.map((place) => [place.id, place]));
  const startDateObj = new Date(startDate);

  const itineraryDays: ItineraryDay[] = parsed.days.map((dayData, dayIndex) => {
    const date = new Date(startDateObj);
    date.setDate(date.getDate() + dayIndex);

    const activities: ItineraryActivity[] = dayData.activities.map((activity, activityIndex) => {
      const place = placeMap.get(activity.placeId);
      if (!place) {
        throw new Error(`AI selected an unknown place id: ${activity.placeId}`);
      }
      const allowedForDay = dayBuckets?.[dayIndex];
      if (allowedForDay?.length && !allowedForDay.some((item) => item.id === place.id)) {
        throw new Error(`AI selected ${place.name} outside Day ${dayIndex + 1}'s geographic cluster.`);
      }
      return hydrateActivityFromPlace(
        {
          id: `osm-${dayIndex + 1}-${activityIndex + 1}`,
          time: activity.time,
          title: place.name,
          description: activity.description,
          location: place.address,
          category: place.category,
          estimatedCost: place.estimatedCost,
          duration: activity.duration,
          isOutdoor: place.isOutdoor,
          placeId: place.id,
        },
        place
      );
    });

    return {
      day: dayIndex + 1,
      date: existingDates?.[dayIndex] ?? date.toISOString().split("T")[0],
      theme: dayData.theme,
      activities,
      notes: dayData.notes,
    };
  });

  let itinerary = recalculateItinerary({
    destination,
    totalDays: days,
    days: itineraryDays,
    generatedAt: new Date().toISOString(),
    weatherAdaptations: parsed.weatherAdaptations ?? [],
  });

  const validation = validateGroundedItinerary(itinerary, places, budget);
  if (!validation.valid) {
    throw new Error(`Grounding validation failed: ${validation.errors.join(" ")}`);
  }

  itinerary = {
    ...itinerary,
    grounding: {
      provider: "OpenStreetMap",
      attribution: OSM_ATTRIBUTION,
      destinationCenter: center ? { lat: center.lat, lng: center.lng } : undefined,
      candidatePlaceCount: places.length,
      groundedActivityCount: validation.groundedActivities,
      validated: true,
      warnings: validation.warnings,
    },
  };

  return itinerary;
}

async function generateAIGroundedItinerary(
  input: GenerateInput,
  places: GroundedPlace[],
  center: DestinationCenter | null
): Promise<{ itinerary: Itinerary; provider: AIProviderName; model: string }> {
  const { destination, startDate, days, budget, dna, weather } = input;
  const activityTarget = Math.max(1, Math.min(3, Math.floor(places.length / Math.max(1, days))));
  const dayBuckets = buildGeographicDayBuckets(places, days, activityTarget);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.max(0, days - 1));

  const prompt = `Create a personalized TripGen itinerary using ONLY the allowed OpenStreetMap places listed below.

Trip:
- Destination: ${destination}
- Start: ${startDate}
- End: ${endDate.toISOString().split("T")[0]}
- Days: ${days}
- Activity/experience budget: ${budget ? `${budget} USD` : "No fixed budget"}

Travel DNA:
${buildDnaContext(dna)}

Weather:
${buildWeatherContext(weather)}

REAL-PLACE DAY CLUSTERS (use placeIds exactly; never invent another place):
${formatDayBucketsForPrompt(dayBuckets)}

Rules:
1. Return exactly ${days} days and ${activityTarget} activities per day.
2. EVERY activity MUST use a unique placeId from the REAL-PLACE DAY CLUSTER for that exact day. Never move a place between day clusters and never invent landmarks, restaurants, districts, or place IDs.
3. Prefer highly relevant places for the user's strongest Travel DNA dimensions.
4. The day clusters are pre-grouped geographically; keep each day's choices inside its cluster to avoid unnecessary back-and-forth.
5. Respect weather; on rainy/stormy days prefer indoor culture/food places.
6. Do not state exact opening hours or ticket prices in the prose. TripGen will attach source metadata separately.
7. Use 24-hour HH:MM times in chronological order.
8. Keep descriptions concise. Explain why each place fits the traveler.
9. Do not repeat the same place across the trip.
10. Return JSON only matching the schema.`;

  const aiResult = await aiChat({
    messages: [
      {
        role: "system",
        content:
          "You are TripGen AI. You must ground every itinerary activity in the supplied real-place allowlist. Never invent a venue or placeId. Return structured JSON only.",
      },
      { role: "user", content: prompt },
    ],
    format: z.toJSONSchema(groundedItinerarySchema),
    temperature: 0.15,
    timeoutMs: 90_000,
    numPredict: Math.min(1500, 220 + days * 190),
  });

  const parsed = groundedItinerarySchema.parse(parseAIJson(aiResult.content));
  const itinerary = buildGroundedItinerary({
    destination,
    startDate,
    days,
    parsed,
    places,
    center,
    budget,
    dayBuckets,
  });
  return { itinerary, provider: aiResult.provider, model: aiResult.model };
}

function placeDescription(place: GroundedPlace): string {
  switch (place.category) {
    case "food":
      return `Try a real local dining stop at ${place.name}, selected from OpenStreetMap data for this destination.`;
    case "nature":
      return `Spend time at ${place.name}, a real outdoor place selected to match nature-focused travel preferences.`;
    case "photography":
      return `Visit ${place.name} for a destination-specific photography stop and scenic perspective.`;
    case "adventure":
      return `Explore ${place.name} as an active, destination-specific experience.`;
    case "nightlife":
      return `Experience the evening atmosphere at ${place.name}, a real mapped venue in the destination area.`;
    case "shopping":
      return `Browse ${place.name}, a real mapped shopping stop in the destination area.`;
    case "relaxation":
      return `Slow the pace at ${place.name}, selected as a relaxation-focused stop.`;
    default:
      return `Explore ${place.name}, a real mapped cultural place selected for this itinerary.`;
  }
}

function generateGroundedFallback(
  input: GenerateInput,
  places: GroundedPlace[],
  center: DestinationCenter | null,
  preferredCategories: ActivityCategory[] = []
): Itinerary {
  const { destination, startDate, days, budget, weather } = input;
  const start = new Date(startDate);
  const used = new Set<string>();
  const itineraryDays: ItineraryDay[] = [];

  const activitiesPerDay = places.length >= days * 3 ? 3 : Math.max(1, Math.floor(places.length / days));

  const ranked = [...places].sort((a, b) => {
    const aPreferred = preferredCategories.includes(a.category) ? 50 : 0;
    const bPreferred = preferredCategories.includes(b.category) ? 50 : 0;
    return b.score + bPreferred - (a.score + aPreferred);
  });
  const dayBuckets = buildGeographicDayBuckets(ranked, days, activitiesPerDay);

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const date = new Date(start);
    date.setDate(date.getDate() + dayIndex);
    const dayWeather = weather?.[dayIndex];
    const badWeather = dayWeather && ["rain", "thunderstorm", "snow"].includes(dayWeather.condition);

    let candidates = (dayBuckets[dayIndex] ?? ranked).filter((place) => !used.has(place.id));
    if (badWeather) {
      const indoor = candidates.filter((place) => !place.isOutdoor);
      if (indoor.length >= Math.min(2, activitiesPerDay)) candidates = indoor;
    }

    const chosen = candidates.slice(0, Math.min(activitiesPerDay, candidates.length));
    const activities = chosen.map((place, activityIndex) => {
      used.add(place.id);
      return hydrateActivityFromPlace(
        {
          id: `grounded-fallback-${dayIndex + 1}-${activityIndex + 1}`,
          time: timeSlots[activityIndex] ?? "18:00",
          title: place.name,
          description: placeDescription(place),
          location: place.address,
          category: place.category,
          estimatedCost: place.estimatedCost,
          duration: "2 hours",
          isOutdoor: place.isOutdoor,
          placeId: place.id,
        },
        place
      );
    });

    itineraryDays.push({
      day: dayIndex + 1,
      date: date.toISOString().split("T")[0],
      theme: badWeather ? "Weather-aware real places" : "Travel DNA real places",
      activities,
      notes: badWeather
        ? `Rain or severe weather is forecast (${dayWeather?.description}); indoor mapped places were prioritized.`
        : undefined,
    });
  }

  let itinerary = recalculateItinerary({
    destination,
    totalDays: days,
    days: itineraryDays,
    generatedAt: new Date().toISOString(),
  });

  const validation = validateGroundedItinerary(itinerary, places, budget);
  if (!validation.valid) {
    throw new Error(`Real-place fallback validation failed: ${validation.errors.join(" ")}`);
  }
  itinerary = {
    ...itinerary,
    grounding: {
      provider: "OpenStreetMap",
      attribution: OSM_ATTRIBUTION,
      destinationCenter: center ? { lat: center.lat, lng: center.lng } : undefined,
      candidatePlaceCount: places.length,
      groundedActivityCount: validation.groundedActivities,
      validated: validation.valid,
      warnings: validation.warnings,
    },
  };
  return itinerary;
}

export async function generateItinerary(input: GenerateInput): Promise<Itinerary> {
  // Keep the prompt compact: ranked real places are much more useful than a giant POI dump.
  const placeLimit = Math.min(36, Math.max(12, input.days * 3));
  const grounded = await getGroundedPlaces(input.destination, input.dna, placeLimit);
  const requiredPlaces = Math.max(4, input.days);

  if (grounded.places.length < requiredPlaces) {
    const broadHint = grounded.diagnostics.broadDestination
      ? ` ${grounded.diagnostics.clarificationQuestion || "Tell TripGen which city or town you mean — normal conversational wording is fine."}`
      : "";
    throw new RealPlacesUnavailableError(
      `TripGen could only verify ${grounded.places.length} real places for ${input.destination}; ${requiredPlaces} are required.${broadHint}`,
      {
        destination: input.destination,
        found: grounded.places.length,
        required: requiredPlaces,
        broadDestination: grounded.diagnostics.broadDestination,
        warnings: grounded.diagnostics.warnings,
      }
    );
  }

  try {
    const result = await generateAIGroundedItinerary(
      input,
      grounded.places,
      grounded.center
    );
    console.info(
      `[TripGen AI] Grounded itinerary generated by ${result.provider}/${result.model} using ${grounded.places.length} verified OpenStreetMap places`
    );
    return result.itinerary;
  } catch (error) {
    console.warn(
      `[TripGen AI] Cloud/local AI generation failed; using deterministic REAL-PLACE fallback only: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return generateGroundedFallback(input, grounded.places, grounded.center);
}

export async function adaptItineraryForWeather(
  itinerary: Itinerary,
  weather: WeatherData[]
): Promise<{ itinerary: Itinerary; adaptations: string[] }> {
  const adaptations: string[] = [];
  const updatedDays = itinerary.days.map((day) => {
    const dayWeather = weather[day.day - 1];
    if (!dayWeather || !["rain", "thunderstorm", "snow"].includes(dayWeather.condition)) {
      return day;
    }
    return {
      ...day,
      notes: day.notes
        ? `${day.notes} Review outdoor stops because ${dayWeather.description} is forecast.`
        : `Review outdoor stops because ${dayWeather.description} is forecast.`,
    };
  });
  return {
    itinerary: { ...itinerary, days: updatedDays, weatherAdaptations: adaptations },
    adaptations,
  };
}

function existingPlacesFromItinerary(itinerary: Itinerary): GroundedPlace[] {
  const places: GroundedPlace[] = [];
  const seen = new Set<string>();
  for (const day of itinerary.days) {
    for (const activity of day.activities) {
      if (
        !activity.placeId ||
        activity.lat === undefined ||
        activity.lng === undefined ||
        seen.has(activity.placeId)
      ) {
        continue;
      }
      seen.add(activity.placeId);
      const match = activity.placeId.match(/^osm-(node|way|relation)-(\d+)$/);
      places.push({
        id: activity.placeId,
        osmType: (match?.[1] as GroundedPlace["osmType"]) ?? "node",
        osmId: match ? Number(match[2]) : 0,
        name: activity.title,
        category: activity.category,
        address: activity.location ?? itinerary.destination,
        lat: activity.lat,
        lng: activity.lng,
        isOutdoor: activity.isOutdoor,
        openingHours: activity.openingHours,
        estimatedCost: activity.estimatedCost,
        costBasis: activity.costBasis,
        source: "OpenStreetMap",
        sourceUrl:
          activity.placeSourceUrl ??
          (match ? `https://www.openstreetmap.org/${match[1]}/${match[2]}` : "https://www.openstreetmap.org"),
        distanceKm: activity.placeDistanceKm ?? 0,
        score: 999,
      });
    }
  }
  return places;
}

function mergePlaces(primary: GroundedPlace[], existing: GroundedPlace[]): GroundedPlace[] {
  const merged = new Map<string, GroundedPlace>();
  for (const place of [...existing, ...primary]) merged.set(place.id, place);
  return [...merged.values()];
}

async function modifyWithAIProvider(
  input: ModifyItineraryInput,
  places: GroundedPlace[],
  center: DestinationCenter | null
): Promise<{ itinerary: Itinerary; provider: AIProviderName; model: string }> {
  const { itinerary, instruction, destination, budget, dna, weather } = input;
  const activityTarget = Math.max(1, Math.min(3, Math.floor(places.length / Math.max(1, itinerary.days.length))));
  const dayBuckets = buildGeographicDayBuckets(places, itinerary.days.length, activityTarget);
  const existingDates = itinerary.days.map((day) => day.date);

  const prompt = `Modify this TripGen itinerary according to the user's instruction, but ground EVERY activity in the allowed real-place list.

Destination: ${destination}
Budget: ${budget ? `${budget} USD` : "No fixed budget"}
Travel DNA: ${dna ? buildDnaContext(dna) : "Not available"}
Weather:\n${buildWeatherContext(weather)}

User instruction:\n${instruction}

REAL-PLACE DAY CLUSTERS (use only placeIds from the matching day):
${formatDayBucketsForPrompt(dayBuckets)}

Existing itinerary:
${JSON.stringify(
  itinerary.days.map((day) => ({
    day: day.day,
    date: day.date,
    theme: day.theme,
    activities: day.activities.map((activity) => ({
      time: activity.time,
      placeId: activity.placeId,
      title: activity.title,
      category: activity.category,
    })),
  }))
)}

Rules:
1. Preserve exactly ${itinerary.days.length} days and their dates.
2. Every activity must use a unique placeId from that day's REAL-PLACE DAY CLUSTER; never invent a venue, neighborhood, or place ID.
3. Apply the user's requested change clearly.
4. Keep about ${activityTarget} activities per day, stay inside each day's geographic cluster, and use chronological HH:MM times.
5. Respect bad weather by preferring indoor places when appropriate.
6. Do not state exact prices/opening hours in descriptions.
7. Return JSON only matching the schema.`;

  const aiResult = await aiChat({
    messages: [
      {
        role: "system",
        content:
          "You are TripGen AI's grounded itinerary editor. Use only the supplied real-place allowlist and return structured JSON only.",
      },
      { role: "user", content: prompt },
    ],
    format: z.toJSONSchema(groundedItinerarySchema),
    temperature: 0.12,
    timeoutMs: 90_000,
    numPredict: Math.min(1500, 220 + itinerary.days.length * 190),
  });

  const parsed = groundedItinerarySchema.parse(parseAIJson(aiResult.content));
  const updated = buildGroundedItinerary({
    destination,
    startDate: itinerary.days[0]?.date ?? new Date().toISOString().split("T")[0],
    days: itinerary.days.length,
    parsed,
    places,
    center,
    budget,
    existingDates,
    dayBuckets,
  });
  return { itinerary: updated, provider: aiResult.provider, model: aiResult.model };
}

function preferredCategoriesFromInstruction(instruction: string): ActivityCategory[] {
  const lower = instruction.toLowerCase();
  if (lower.includes("food") || lower.includes("restaurant")) return ["food"];
  if (lower.includes("outdoor") || lower.includes("nature")) return ["nature", "photography", "adventure"];
  if (lower.includes("culture") || lower.includes("museum")) return ["culture"];
  if (lower.includes("night")) return ["nightlife"];
  if (lower.includes("relax") || lower.includes("spa")) return ["relaxation"];
  return [];
}

async function modifyWithGroundedFallback(
  input: ModifyItineraryInput,
  places: GroundedPlace[],
  center: DestinationCenter | null
): Promise<Itinerary> {
  const dna = input.dna;
  if (!dna) return input.itinerary;

  const generated = generateGroundedFallback(
    {
      destination: input.destination,
      startDate: input.itinerary.days[0]?.date ?? new Date().toISOString().split("T")[0],
      days: input.itinerary.days.length,
      budget: input.budget,
      dna,
      weather: input.weather,
    },
    places,
    center,
    preferredCategoriesFromInstruction(input.instruction)
  );

  return {
    ...generated,
    days: generated.days.map((day, index) => ({
      ...day,
      date: input.itinerary.days[index]?.date ?? day.date,
    })),
  };
}

export async function modifyItineraryWithAI(
  input: ModifyItineraryInput
): Promise<ModifyItineraryResult> {
  const livePlaces = await getGroundedPlaces(input.destination, input.dna, Math.min(36, Math.max(12, input.itinerary.days.length * 3)));
  const places = mergePlaces(livePlaces.places, existingPlacesFromItinerary(input.itinerary));
  const requiredPlaces = Math.max(4, input.itinerary.days.length);

  if (places.length >= requiredPlaces) {
    try {
      const result = await modifyWithAIProvider(input, places, livePlaces.center);
      console.info(`[TripGen AI] Grounded itinerary modified by ${result.provider}/${result.model}`);
      return { itinerary: result.itinerary, provider: result.provider };
    } catch (error) {
      console.warn(
        `[TripGen AI] Grounded itinerary edit failed; using real-place fallback: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    return {
      itinerary: await modifyWithGroundedFallback(input, places, livePlaces.center),
      provider: "fallback",
    };
  }

  throw new RealPlacesUnavailableError(
    `TripGen could not verify enough real places to safely modify this itinerary for ${input.destination}.`,
    {
      destination: input.destination,
      found: places.length,
      required: requiredPlaces,
      broadDestination: livePlaces.diagnostics.broadDestination,
      warnings: livePlaces.diagnostics.warnings,
    }
  );
}
