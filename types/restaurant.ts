export type RestaurantCategory =
  | "fine_dining"
  | "casual"
  | "street_food"
  | "cafe"
  | "bar"
  | "local_specialty";

export type Restaurant = {
  id: string;
  name: string;
  cuisine?: string;
  category: RestaurantCategory;
  priceRange: 1 | 2 | 3 | 4;
  rating?: number;
  address?: string;
  description?: string;
  matchesDNA: string[];
  sourceUrl?: string;
  lat?: number;
  lng?: number;
};

export type RestaurantRecommendation = {
  destination: string;
  restaurants: Restaurant[];
};
