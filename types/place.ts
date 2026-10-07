import type { ActivityCategory } from "@/types/itinerary";

export type GroundedPlace = {
  id: string;
  osmType: "node" | "way" | "relation";
  osmId: number;
  name: string;
  category: ActivityCategory;
  address: string;
  lat: number;
  lng: number;
  isOutdoor: boolean;
  openingHours?: string;
  website?: string;
  estimatedCost?: number;
  costBasis?: "category-estimate" | "osm-fee-tag" | "osm-charge";
  source: "OpenStreetMap";
  sourceUrl: string;
  distanceKm: number;
  score: number;
};

export type DestinationCenter = {
  displayName: string;
  lat: number;
  lng: number;
  countryCode?: string;
  placeType?: string;
  resolvedQuery?: string;
  resolutionSource?: "direct" | "openrouter" | "raw";
  needsClarification?: boolean;
  clarificationQuestion?: string | null;
};
