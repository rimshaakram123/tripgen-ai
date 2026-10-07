import type { ItineraryDay, ItineraryActivity } from "@/types/itinerary";
import type { Trip } from "@/types/trip";

export type BudgetSummary = {
  totalBudget: number;
  estimatedSpend: number;
  remaining: number;
  byDay: { day: number; spend: number }[];
  byCategory: Record<string, number>;
  percentUsed: number;
};

export async function calculateBudget(trip: Trip): Promise<BudgetSummary> {
  const budget = trip.budget ?? 0;
  const itinerary = trip.itinerary;

  if (!itinerary) {
    return {
      totalBudget: budget,
      estimatedSpend: 0,
      remaining: budget,
      byDay: [],
      byCategory: {},
      percentUsed: 0,
    };
  }

  let estimatedSpend = 0;
  const byDay: { day: number; spend: number }[] = [];
  const byCategory: Record<string, number> = {};

  for (const day of itinerary.days as ItineraryDay[]) {
    let daySpend = 0;
    for (const activity of day.activities as ItineraryActivity[]) {
      const cost = activity.estimatedCost ?? 0;
      daySpend += cost;
      estimatedSpend += cost;
      byCategory[activity.category] = (byCategory[activity.category] ?? 0) + cost;
    }
    byDay.push({ day: day.day, spend: daySpend });
  }

  return {
    totalBudget: budget,
    estimatedSpend,
    remaining: budget - estimatedSpend,
    byDay,
    byCategory,
    percentUsed: budget > 0 ? Math.round((estimatedSpend / budget) * 100) : 0,
  };
}

export async function optimizeBudget(
  trip: Trip,
  targetBudget: number
): Promise<{ savings: number; suggestions: string[] }> {
  const summary = await calculateBudget(trip);
  const overage = summary.estimatedSpend - targetBudget;

  if (overage <= 0) {
    return { savings: 0, suggestions: ["Your trip is within budget."] };
  }

  const suggestions: string[] = [];

  const sortedCategories = Object.entries(summary.byCategory).sort(
    (a, b) => b[1] - a[1]
  );

  for (const [category, spend] of sortedCategories) {
    if (overage <= 0) break;
    const potentialSaving = Math.min(spend * 0.3, overage);
    suggestions.push(
      `Reduce ${category} spending by ~$${Math.round(potentialSaving)} (30% of $${spend})`
    );
  }

  suggestions.push("Consider free walking tours and public parks");
  suggestions.push("Eat at local markets instead of sit-down restaurants");
  suggestions.push("Use public transport instead of taxis");

  return { savings: overage, suggestions };
}
