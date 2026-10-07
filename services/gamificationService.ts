import type { Trip } from "@/types/trip";

export type GamificationStats = {
  totalTrips: number;
  completedTrips: number;
  destinationsVisited: number;
  xp: number;
  level: number;
  badges: Badge[];
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

const ALL_BADGES: Badge[] = [
  { id: "first-trip", name: "First Steps", description: "Created your first trip", icon: "compass", unlocked: false },
  { id: "dna-discovered", name: "Identity Found", description: "Completed your Travel DNA", icon: "brain", unlocked: false },
  { id: "globetrotter", name: "Globetrotter", description: "Visited 5+ destinations", icon: "globe", unlocked: false },
  { id: "budget-master", name: "Budget Master", description: "Completed a trip under budget", icon: "wallet", unlocked: false },
  { id: "weather-adapted", name: "Storm Chaser", description: "Had AI adapt your trip for weather", icon: "cloud", unlocked: false },
  { id: "foodie", name: "Culinary Explorer", description: "Food is your top DNA trait", icon: "utensils", unlocked: false },
];

export async function getGamificationStats(
  userId: string,
  trips: Trip[]
): Promise<GamificationStats> {
  const completedTrips = trips.filter((t) => t.status === "COMPLETED");
  const destinations = new Set(trips.map((t) => t.destination));

  const xp = trips.length * 50 + completedTrips.length * 100 + destinations.size * 75;
  const level = Math.floor(xp / 200) + 1;

  const badges = ALL_BADGES.map((badge) => {
    let unlocked = false;
    switch (badge.id) {
      case "first-trip": unlocked = trips.length >= 1; break;
      case "globetrotter": unlocked = destinations.size >= 5; break;
      case "budget-master": unlocked = completedTrips.some((t) => (t.budget ?? 0) > 0); break;
      default: unlocked = false;
    }
    return { ...badge, unlocked };
  });

  return {
    totalTrips: trips.length,
    completedTrips: completedTrips.length,
    destinationsVisited: destinations.size,
    xp,
    level,
    badges,
  };
}
