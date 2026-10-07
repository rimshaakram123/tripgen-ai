import type { TravelDNA } from "@/types/travelDNA";
import type { ActivityCategory } from "@/types/itinerary";
import type { DestinationCenter, GroundedPlace } from "@/types/place";
import { resolveDestinationIntent, shouldUseDestinationAI } from "@/services/destinationIntentService";

const NOMINATIM_HOST = (process.env.NOMINATIM_HOST || "https://nominatim.openstreetmap.org").replace(/\/+$/, "");
const PRIMARY_OVERPASS_URL = process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter";
const USER_AGENT = process.env.PLACES_USER_AGENT || "TripGenAI/0.3 (student travel planner)";
const SEARCH_RADIUS_METERS = Number(process.env.PLACES_RADIUS_METERS || 20_000);
const FETCH_TIMEOUT_MS = Number(process.env.PLACES_TIMEOUT_MS || 10_000);
const GEOCODING_FALLBACK_URL = (process.env.GEOCODING_FALLBACK_URL || "https://geocoding-api.open-meteo.com/v1/search").replace(/\/+$/, "");

const configuredOverpassUrls = (process.env.OVERPASS_URLS || "")
  .split(/[;,\n]/)
  .map((value) => value.trim())
  .filter(Boolean);

const OVERPASS_URLS = Array.from(
  new Set([
    PRIMARY_OVERPASS_URL,
    ...configuredOverpassUrls,
    "https://overpass.kumi.systems/api/interpreter",
  ])
).slice(0, 2);

const globalPlaceCache = globalThis as unknown as {
  __tripgenGeocodeCache?: Map<string, { expires: number; value: DestinationCenter }>;
  __tripgenPlacesCache?: Map<string, { expires: number; value: GroundedPlace[] }>;
  __tripgenNominatimLastRequest?: number;
};

const geocodeCache =
  globalPlaceCache.__tripgenGeocodeCache ??
  (globalPlaceCache.__tripgenGeocodeCache = new Map());
const placesCache =
  globalPlaceCache.__tripgenPlacesCache ??
  (globalPlaceCache.__tripgenPlacesCache = new Map());

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  addresstype?: string;
  address?: { country_code?: string };
};

type OpenMeteoGeocodingResponse = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country_code?: string;
    country?: string;
    admin1?: string;
    feature_code?: string;
    population?: number;
  }>;
};

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

export type PlaceLookupDiagnostics = {
  attempts: string[];
  warnings: string[];
  broadDestination: boolean;
  resolvedDestination?: string;
  resolutionSource?: "direct" | "openrouter" | "raw";
  clarificationQuestion?: string | null;
};

export type GroundedPlacesResult = {
  center: DestinationCenter | null;
  places: GroundedPlace[];
  diagnostics: PlaceLookupDiagnostics;
};

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function respectNominatimRateLimit(): Promise<void> {
  const now = Date.now();
  const last = globalPlaceCache.__tripgenNominatimLastRequest ?? 0;
  const waitMs = Math.max(0, 1100 - (now - last));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  globalPlaceCache.__tripgenNominatimLastRequest = Date.now();
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getName(tags: Record<string, string>): string | undefined {
  return tags["name:en"] || tags.name || tags.official_name || tags.short_name;
}

function inferCategory(tags: Record<string, string>): ActivityCategory {
  const amenity = tags.amenity;
  const tourism = tags.tourism;
  const leisure = tags.leisure;
  const shop = tags.shop;

  if (["restaurant", "cafe", "fast_food", "food_court", "ice_cream"].includes(amenity)) {
    return "food";
  }
  if (["bar", "pub", "nightclub", "casino"].includes(amenity)) {
    return "nightlife";
  }
  if (shop || amenity === "marketplace") return "shopping";
  if (tourism === "viewpoint") return "photography";
  if (["park", "garden", "nature_reserve"].includes(leisure)) return "nature";
  if (tourism === "zoo") return "nature";
  if (["theme_park", "water_park"].includes(tourism)) return "adventure";
  if (["spa", "sauna"].includes(leisure) || amenity === "spa") return "relaxation";
  if (
    ["museum", "gallery"].includes(tourism) ||
    ["arts_centre", "theatre", "place_of_worship"].includes(amenity) ||
    Boolean(tags.historic)
  ) {
    return "culture";
  }
  return "culture";
}

function inferOutdoor(tags: Record<string, string>, category: ActivityCategory): boolean {
  if (tags.indoor === "yes") return false;
  if (tags.outdoor === "yes") return true;
  if (["nature", "photography", "adventure"].includes(category)) return true;
  if (tags.leisure === "park" || tags.leisure === "garden" || tags.tourism === "viewpoint") {
    return true;
  }
  return false;
}

function buildAddress(tags: Record<string, string>, destination: string): string {
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const locality =
    tags["addr:city"] ||
    tags["addr:town"] ||
    tags["addr:district"] ||
    tags["addr:suburb"] ||
    "";
  const pieces = [street, locality].filter(Boolean);
  return pieces.length ? pieces.join(", ") : destination;
}

function parseTaggedCharge(tags: Record<string, string>): number | undefined {
  const candidates = [tags.charge, tags["fee:amount"], tags["charge:amount"], tags.admission];
  for (const value of candidates) {
    if (!value) continue;
    const match = value.replace(/,/g, "").match(/(?:USD|US\$|\$)?\s*(\d+(?:\.\d+)?)/i);
    if (!match) continue;
    const amount = Number(match[1]);
    if (Number.isFinite(amount) && amount >= 0 && amount <= 500) return Math.round(amount);
  }
  return undefined;
}

function estimateCost(
  tags: Record<string, string>,
  category: ActivityCategory
): { amount?: number; basis?: GroundedPlace["costBasis"] } {
  const taggedCharge = parseTaggedCharge(tags);
  if (taggedCharge !== undefined) {
    return { amount: taggedCharge, basis: "osm-charge" };
  }
  if (tags.fee === "no") return { amount: 0, basis: "osm-fee-tag" };

  // Planning estimates only. They represent likely activity spend, not verified live ticket prices.
  if (tags.tourism === "theme_park") return { amount: 35, basis: "category-estimate" };
  if (tags.tourism === "water_park") return { amount: 30, basis: "category-estimate" };
  if (tags.tourism === "zoo") return { amount: 15, basis: "category-estimate" };
  if (tags.amenity === "restaurant") return { amount: 20, basis: "category-estimate" };
  if (["cafe", "fast_food", "food_court", "ice_cream"].includes(tags.amenity)) {
    return { amount: 10, basis: "category-estimate" };
  }
  if (["nightclub", "casino"].includes(tags.amenity)) return { amount: 25, basis: "category-estimate" };
  if (["bar", "pub"].includes(tags.amenity)) return { amount: 18, basis: "category-estimate" };
  if (["spa", "sauna"].includes(tags.leisure) || tags.amenity === "spa") {
    return { amount: 25, basis: "category-estimate" };
  }
  if (["museum", "gallery"].includes(tags.tourism)) return { amount: 8, basis: "category-estimate" };

  const categoryEstimate: Partial<Record<ActivityCategory, number>> = {
    food: 15,
    nightlife: 20,
    adventure: 20,
    culture: 6,
    relaxation: 20,
    shopping: 0,
    photography: 0,
    nature: 0,
  };
  const amount = categoryEstimate[category];
  return amount === undefined ? {} : { amount, basis: "category-estimate" };
}

function dnaScoreForCategory(category: ActivityCategory, dna?: TravelDNA): number {
  if (!dna) return 50;
  switch (category) {
    case "adventure":
      return dna.adventure;
    case "culture":
      return dna.culture;
    case "food":
      return dna.food;
    case "nature":
      return dna.nature;
    case "photography":
      return dna.photography;
    case "relaxation":
      return dna.relaxation;
    case "nightlife":
      return dna.nightlife;
    case "shopping":
      return Math.round((dna.food + dna.budget) / 2);
    default:
      return 50;
  }
}

function qualityScore(tags: Record<string, string>): number {
  let score = 0;
  if (tags.wikidata) score += 18;
  if (tags.wikipedia) score += 14;
  if (tags.website || tags["contact:website"]) score += 6;
  if (tags.opening_hours) score += 4;
  if (tags["name:en"]) score += 3;
  return score;
}

function isBroadDestination(center: DestinationCenter): boolean {
  return ["country", "state", "province", "region"].includes(
    (center.placeType || "").toLowerCase()
  );
}

function openMeteoPlaceType(featureCode?: string): string {
  if (!featureCode) return "city";
  if (featureCode.startsWith("PPL")) return "city";
  if (featureCode.startsWith("ADM")) return "region";
  return "city";
}

async function geocodeWithNominatim(destination: string): Promise<DestinationCenter | null> {
  await respectNominatimRateLimit();

  const params = new URLSearchParams({
    q: destination,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
  });
  const contactEmail = process.env.PLACES_CONTACT_EMAIL?.trim();
  if (contactEmail) params.set("email", contactEmail);

  const { signal, clear } = withTimeout(Math.min(FETCH_TIMEOUT_MS, 7_000));
  try {
    const response = await fetch(`${NOMINATIM_HOST}/search?${params.toString()}`, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en",
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    });
    if (!response.ok) throw new Error(`Nominatim returned HTTP ${response.status}`);

    const results = (await response.json()) as NominatimResult[];
    const first = results[0];
    if (!first) return null;

    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return {
      displayName: first.display_name,
      lat,
      lng,
      countryCode: first.address?.country_code?.toUpperCase(),
      placeType: first.addresstype || first.type,
    };
  } finally {
    clear();
  }
}

async function geocodeWithOpenMeteo(destination: string): Promise<DestinationCenter | null> {
  // Open-Meteo's `name` search is strongest with a settlement name rather than a full
  // sentence or `City, Country` string. Try several safe variants without requiring
  // users to learn a special input format.
  const variants = Array.from(
    new Set([
      destination.trim(),
      destination.split(",")[0]?.trim(),
      destination.replace(/\b(city of|visit|travel to|go to|trip to)\b/gi, "").trim(),
    ].filter((value): value is string => Boolean(value && value.length >= 2)))
  );

  for (const name of variants) {
    const params = new URLSearchParams({
      name,
      count: "5",
      language: "en",
      format: "json",
    });
    const { signal, clear } = withTimeout(Math.min(FETCH_TIMEOUT_MS, 7_000));

    try {
      const response = await fetch(`${GEOCODING_FALLBACK_URL}?${params.toString()}`, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error(`Open-Meteo geocoding returned HTTP ${response.status}`);

      const payload = (await response.json()) as OpenMeteoGeocodingResponse;
      const first = payload.results?.find(
        (item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
      );
      if (!first) continue;

      return {
        displayName: [first.name, first.admin1, first.country].filter(Boolean).join(", "),
        lat: first.latitude,
        lng: first.longitude,
        countryCode: first.country_code?.toUpperCase(),
        placeType: openMeteoPlaceType(first.feature_code),
      };
    } finally {
      clear();
    }
  }

  return null;
}

export async function geocodeDestination(destination: string): Promise<DestinationCenter | null> {
  const originalInput = destination.trim();
  const cacheKey = normalizeKey(originalInput);
  const cached = geocodeCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value;

  async function geocodeQuery(query: string): Promise<DestinationCenter | null> {
    let value: DestinationCenter | null = null;

    try {
      value = await geocodeWithNominatim(query);
    } catch (error) {
      console.warn(
        `[TripGen Places] Nominatim geocoding failed for "${query}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    if (!value) {
      try {
        value = await geocodeWithOpenMeteo(query);
        if (value) {
          console.info(`[TripGen Places] Geocoded "${query}" using Open-Meteo fallback.`);
        }
      } catch (error) {
        console.warn(
          `[TripGen Places] Open-Meteo geocoding fallback failed for "${query}": ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return value;
  }

  let resolvedQuery = originalInput;
  let resolutionSource: "direct" | "openrouter" | "raw" = "direct";
  let needsClarification = false;
  let clarificationQuestion: string | null = null;
  let value: DestinationCenter | null = null;

  // Conversational input is normalized by the active AI provider first, so users can type things like
  // "I want to visit Chengdu" or Arabic natural-language equivalents.
  if (shouldUseDestinationAI(originalInput)) {
    const intent = await resolveDestinationIntent(originalInput);
    if (intent.destination) resolvedQuery = intent.destination;
    resolutionSource = intent.source;
    needsClarification = intent.needsClarification;
    clarificationQuestion = intent.clarificationQuestion;
    value = await geocodeQuery(resolvedQuery);
  } else {
    // Fast path for normal place names such as "Chengdu" or "Tokyo, Japan".
    value = await geocodeQuery(originalInput);

    // If a short/misspelled place name cannot be geocoded, ask the active AI provider to normalize it.
    if (!value) {
      const intent = await resolveDestinationIntent(originalInput);
      if (intent.destination && normalizeKey(intent.destination) !== normalizeKey(originalInput)) {
        resolvedQuery = intent.destination;
        resolutionSource = intent.source;
        needsClarification = intent.needsClarification;
        clarificationQuestion = intent.clarificationQuestion;
        value = await geocodeQuery(resolvedQuery);
      }
    }
  }

  if (!value) return null;

  value = {
    ...value,
    resolvedQuery,
    resolutionSource,
    needsClarification,
    clarificationQuestion,
  };

  geocodeCache.set(cacheKey, { expires: Date.now() + 24 * 60 * 60 * 1000, value });
  return value;
}

function buildOverpassQuery(lat: number, lng: number, radiusMeters: number): string {
  const attractionRadius = Math.max(5000, radiusMeters);
  const localRadius = Math.min(attractionRadius, 10_000);
  const attractionAround = `(around:${attractionRadius},${lat},${lng})`;
  const localAround = `(around:${localRadius},${lat},${lng})`;

  return `[out:json][timeout:10];\n(\n` +
    `nwr${attractionAround}["name"]["tourism"~"^(attraction|museum|gallery|viewpoint|zoo|theme_park)$"];\n` +
    `nwr${attractionAround}["name"]["historic"];\n` +
    `nwr${attractionAround}["name"]["leisure"~"^(park|garden|nature_reserve|spa|water_park)$"];\n` +
    `nwr${localAround}["name"]["amenity"~"^(restaurant|cafe|fast_food|food_court|marketplace|arts_centre|theatre|place_of_worship|bar|pub|nightclub|casino)$"];\n` +
    `nwr${localAround}["name"]["shop"~"^(mall|department_store)$"];\n` +
    `);\nout center tags;`;
}

function parseOverpassPlaces(
  payload: OverpassResponse,
  center: DestinationCenter,
  destination: string
): GroundedPlace[] {
  const dedupe = new Set<string>();
  const places: GroundedPlace[] = [];

  for (const element of payload.elements ?? []) {
    const tags = element.tags ?? {};
    const name = getName(tags)?.trim();
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (!name || lat === undefined || lng === undefined) continue;

    const category = inferCategory(tags);
    const dedupeKey = `${normalizeKey(name)}:${category}`;
    if (dedupe.has(dedupeKey)) continue;
    dedupe.add(dedupeKey);

    const dist = distanceKm(center.lat, center.lng, lat, lng);
    const cost = estimateCost(tags, category);
    const website = tags.website || tags["contact:website"];
    const id = `osm-${element.type}-${element.id}`;
    places.push({
      id,
      osmType: element.type,
      osmId: element.id,
      name,
      category,
      address: buildAddress(tags, destination),
      lat,
      lng,
      isOutdoor: inferOutdoor(tags, category),
      openingHours: tags.opening_hours,
      website,
      estimatedCost: cost.amount,
      costBasis: cost.basis,
      source: "OpenStreetMap",
      sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      distanceKm: Number(dist.toFixed(1)),
      score: qualityScore(tags) - dist * 0.7,
    });
  }

  return places;
}

async function requestOverpass(
  endpoint: string,
  query: string,
  center: DestinationCenter,
  destination: string
): Promise<GroundedPlace[]> {
  const { signal, clear } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      body: new URLSearchParams({ data: query }).toString(),
      cache: "no-store",
      signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = (await response.json()) as OverpassResponse;
    return parseOverpassPlaces(payload, center, destination);
  } finally {
    clear();
  }
}


function balanceAndLimit(places: GroundedPlace[], limit: number): GroundedPlace[] {
  const categoryCaps: Partial<Record<ActivityCategory, number>> = {
    food: 10,
    culture: 11,
    nature: 7,
    photography: 5,
    adventure: 5,
    nightlife: 4,
    shopping: 4,
    relaxation: 4,
  };
  const counts = new Map<ActivityCategory, number>();
  const selected: GroundedPlace[] = [];

  for (const place of [...places].sort((a, b) => b.score - a.score)) {
    const count = counts.get(place.category) ?? 0;
    const cap = categoryCaps[place.category] ?? 4;
    if (count >= cap) continue;
    selected.push(place);
    counts.set(place.category, count + 1);
    if (selected.length >= limit) break;
  }

  if (selected.length < Math.min(12, limit)) {
    for (const place of [...places].sort((a, b) => b.score - a.score)) {
      if (selected.some((item) => item.id === place.id)) continue;
      selected.push(place);
      if (selected.length >= limit) break;
    }
  }

  return selected;
}

export async function getGroundedPlaces(
  destination: string,
  dna?: TravelDNA | null,
  limit = 36
): Promise<GroundedPlacesResult> {
  const diagnostics: PlaceLookupDiagnostics = {
    attempts: [],
    warnings: [],
    broadDestination: false,
  };

  const center = await geocodeDestination(destination);
  if (!center) {
    diagnostics.warnings.push("Destination could not be geocoded.");
    return { center: null, places: [], diagnostics };
  }

  diagnostics.resolvedDestination = center.resolvedQuery || center.displayName;
  diagnostics.resolutionSource = center.resolutionSource;
  diagnostics.clarificationQuestion = center.clarificationQuestion;

  if (isBroadDestination(center) || center.needsClarification) {
    diagnostics.broadDestination = true;
    diagnostics.warnings.push(
      center.clarificationQuestion ||
        `"${destination}" resolved too broadly. Tell TripGen the city or town you mean in normal language.`
    );
    return { center, places: [], diagnostics };
  }

  const cacheKey = `${center.lat.toFixed(3)},${center.lng.toFixed(3)}:${SEARCH_RADIUS_METERS}`;
  const cached = placesCache.get(cacheKey);
  let rawPlaces: GroundedPlace[] | null =
    cached && cached.expires > Date.now() ? cached.value : null;

  if (!rawPlaces) {
    const radius = Math.max(8_000, Math.min(SEARCH_RADIUS_METERS, 25_000));
    const query = buildOverpassQuery(center.lat, center.lng, radius);
    let successfulResponse = false;
    let result: GroundedPlace[] = [];

    // Public Overpass endpoints are a fallback data source, not something the user
    // should wait several minutes for. Try the primary endpoint once, then one backup
    // only if the primary request itself fails. A successful response is authoritative
    // even when the mapped POI count is small.
    for (const endpoint of OVERPASS_URLS) {
      diagnostics.attempts.push(`${endpoint} @ ${radius}m`);
      try {
        result = await requestOverpass(endpoint, query, center, destination);
        successfulResponse = true;
        break;
      } catch (error) {
        diagnostics.warnings.push(
          `Overpass failed at ${endpoint}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    rawPlaces = result;
    if (successfulResponse) {
      placesCache.set(cacheKey, {
        expires: Date.now() + 12 * 60 * 60 * 1000,
        value: rawPlaces,
      });
    }
  } else {
    diagnostics.attempts.push("cache");
  }

  const scored = rawPlaces.map((place) => ({
    ...place,
    score: place.score + dnaScoreForCategory(place.category, dna ?? undefined) * 0.55,
  }));

  return {
    center,
    places: balanceAndLimit(scored, Math.max(8, limit)),
    diagnostics,
  };
}

export function compactPlacesForPrompt(places: GroundedPlace[]): string {
  return places
    .map((place) => {
      const details = [
        `id=${place.id}`,
        `name=${place.name}`,
        `category=${place.category}`,
        `distance=${place.distanceKm}km`,
        place.openingHours ? `hours=${place.openingHours}` : null,
        place.estimatedCost !== undefined ? `cost≈$${place.estimatedCost}` : null,
        `outdoor=${place.isOutdoor}`,
      ]
        .filter(Boolean)
        .join(" | ");
      return `- ${details}`;
    })
    .join("\n");
}

export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";
