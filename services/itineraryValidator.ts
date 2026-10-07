import type { Itinerary, ItineraryActivity } from "@/types/itinerary";
import type { GroundedPlace } from "@/types/place";

export type ItineraryValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  groundedActivities: number;
  totalActivities: number;
};

const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function activityDistanceKm(a: ItineraryActivity, b: ItineraryActivity): number | null {
  if (a.lat === undefined || a.lng === undefined || b.lat === undefined || b.lng === undefined) {
    return null;
  }
  const earthRadius = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function hydrateActivityFromPlace(
  activity: ItineraryActivity,
  place: GroundedPlace
): ItineraryActivity {
  return {
    ...activity,
    title: place.name,
    location: place.address,
    category: place.category,
    estimatedCost: place.estimatedCost,
    isOutdoor: place.isOutdoor,
    placeId: place.id,
    lat: place.lat,
    lng: place.lng,
    openingHours: place.openingHours,
    placeSource: place.source,
    placeSourceUrl: place.sourceUrl,
    placeDistanceKm: place.distanceKm,
    costBasis: place.costBasis,
  };
}

export function validateGroundedItinerary(
  itinerary: Itinerary,
  allowedPlaces: GroundedPlace[],
  budget?: number
): ItineraryValidation {
  const placeIds = new Set(allowedPlaces.map((place) => place.id));
  const usedPlaceIds = new Set<string>();
  const errors: string[] = [];
  const warnings: string[] = [];
  let groundedActivities = 0;
  let totalActivities = 0;

  for (const day of itinerary.days) {
    if (!day.activities.length) errors.push(`Day ${day.day} has no activities.`);

    let previousMinutes = -1;
    let previousActivity: ItineraryActivity | null = null;
    for (const activity of day.activities) {
      totalActivities += 1;
      if (!TIME_RE.test(activity.time)) {
        errors.push(`Day ${day.day}: invalid time "${activity.time}".`);
      } else {
        const [hours, minutes] = activity.time.split(":").map(Number);
        const currentMinutes = hours * 60 + minutes;
        if (currentMinutes < previousMinutes) {
          warnings.push(`Day ${day.day}: activities are not ordered chronologically.`);
        }
        previousMinutes = currentMinutes;
      }

      if (!activity.placeId || !placeIds.has(activity.placeId)) {
        errors.push(`Day ${day.day}: "${activity.title}" is not backed by an allowed place.`);
        continue;
      }

      groundedActivities += 1;
      if (usedPlaceIds.has(activity.placeId)) {
        errors.push(`The same place is used more than once: ${activity.title}.`);
      }
      usedPlaceIds.add(activity.placeId);

      if (
        activity.lat === undefined ||
        activity.lng === undefined ||
        !Number.isFinite(activity.lat) ||
        !Number.isFinite(activity.lng)
      ) {
        errors.push(`Day ${day.day}: "${activity.title}" is missing valid coordinates.`);
      }

      if (previousActivity) {
        const jumpKm = activityDistanceKm(previousActivity, activity);
        if (jumpKm !== null && jumpKm > 18) {
          warnings.push(
            `Day ${day.day}: ${previousActivity.title} → ${activity.title} is about ${jumpKm.toFixed(1)} km apart; routing should be reviewed.`
          );
        }
      }
      previousActivity = activity;
    }
  }

  if (budget && itinerary.totalCost !== undefined && itinerary.totalCost > budget * 1.15) {
    warnings.push(
      `Estimated activity spend (${itinerary.totalCost}) is more than 15% above the trip budget (${budget}).`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    groundedActivities,
    totalActivities,
  };
}
