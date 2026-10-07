export type ItineraryActivity = {
  id: string;
  time: string;
  title: string;
  description: string;
  location?: string;
  category: ActivityCategory;
  estimatedCost?: number;
  duration?: string;
  isOutdoor: boolean;
  placeId?: string;
  lat?: number;
  lng?: number;
  openingHours?: string;
  placeSource?: "OpenStreetMap";
  placeSourceUrl?: string;
  placeDistanceKm?: number;
  costBasis?: "category-estimate" | "osm-fee-tag" | "osm-charge";
};

export type ActivityCategory =
  | "adventure"
  | "culture"
  | "food"
  | "nature"
  | "photography"
  | "relaxation"
  | "nightlife"
  | "shopping"
  | "transport";

export type ItineraryDay = {
  day: number;
  date: string;
  theme?: string;
  activities: ItineraryActivity[];
  totalCost?: number;
  notes?: string;
};

export type ItineraryGrounding = {
  provider: "OpenStreetMap";
  attribution: string;
  destinationCenter?: { lat: number; lng: number };
  candidatePlaceCount: number;
  groundedActivityCount: number;
  validated: boolean;
  warnings?: string[];
};

export type Itinerary = {
  tripId?: string;
  destination: string;
  totalDays: number;
  totalCost?: number;
  days: ItineraryDay[];
  generatedAt: string;
  weatherAdaptations?: string[];
  grounding?: ItineraryGrounding;
};
