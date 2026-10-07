import type { TravelDNA } from "@/types/travelDNA";
import type { Restaurant, RestaurantRecommendation, RestaurantCategory } from "@/types/restaurant";
import { getGroundedPlaces } from "@/services/placeService";
import type { GroundedPlace } from "@/types/place";

function restaurantCategory(place: GroundedPlace): RestaurantCategory {
  const name = place.name.toLowerCase();
  if (name.includes("cafe") || name.includes("coffee")) return "cafe";
  if (name.includes("bar") || name.includes("pub") || name.includes("lounge")) return "bar";
  if (name.includes("market") || name.includes("food court")) return "street_food";
  return "local_specialty";
}

function priceRange(place: GroundedPlace): 1 | 2 | 3 | 4 {
  const cost = place.estimatedCost;
  if (cost === undefined || cost <= 10) return 1;
  if (cost <= 25) return 2;
  if (cost <= 55) return 3;
  return 4;
}

export async function getRestaurantRecommendations(
  destination: string,
  dna: TravelDNA
): Promise<RestaurantRecommendation> {
  const grounded = await getGroundedPlaces(destination, dna, 36);
  const foodPlaces = grounded.places
    .filter((place) => place.category === "food" || place.category === "nightlife")
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const restaurants: Restaurant[] = foodPlaces.map((place) => ({
    id: place.id,
    name: place.name,
    cuisine: undefined,
    category: restaurantCategory(place),
    priceRange: priceRange(place),
    rating: undefined,
    address: place.address,
    description: `Verified mapped venue in ${destination}.`,
    matchesDNA: place.category === "nightlife" ? ["food", "nightlife"] : ["food"],
    sourceUrl: place.sourceUrl,
    lat: place.lat,
    lng: place.lng,
  }));

  return { destination, restaurants };
}
