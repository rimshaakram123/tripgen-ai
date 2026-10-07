import { getGroundedPlaces } from "@/services/placeService";

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  sourceUrl?: string;
};

export async function searchPlaces(
  query: string,
  location?: string
): Promise<PlaceResult[]> {
  const destination = location?.trim() || query.trim();
  if (!destination) return [];

  const grounded = await getGroundedPlaces(destination, null, 36);
  const needle = query.trim().toLowerCase();
  const filtered = needle && location
    ? grounded.places.filter((place) =>
        place.name.toLowerCase().includes(needle) || place.category.toLowerCase().includes(needle)
      )
    : grounded.places;

  return filtered.slice(0, 24).map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    category: place.category,
    sourceUrl: place.sourceUrl,
  }));
}

export async function getMapBounds(places: PlaceResult[]) {
  if (places.length === 0) return null;

  const lats = places.map((place) => place.lat);
  const lngs = places.map((place) => place.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}
