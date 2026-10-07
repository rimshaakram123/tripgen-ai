"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

import type { Trip } from "@/types/trip";
import type { BudgetSummary } from "@/services/budgetService";

export function useBudget(trip: Trip | null) {
  const tripId = trip?.id;
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBudget = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/budget`);
      if (!res.ok) return;
      const data = await res.json();
      setSummary(data.summary);
      return data.summary;
    } catch {
      toast.error("Failed to load budget data");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  const optimize = useCallback(
    async (targetBudget: number) => {
      if (!tripId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/trips/${tripId}/budget`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetBudget }),
        });
        if (!res.ok) return;
        const data = await res.json();
        toast.success(data.suggestions?.[0] ?? "Budget optimized");
        return data;
      } catch {
        toast.error("Failed to optimize budget");
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  return {
    summary,
    loading,
    fetchBudget,
    optimize,
  };
}
