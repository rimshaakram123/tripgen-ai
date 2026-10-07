"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import type { Trip, CreateTripInput } from "@/types/trip";

export function useTrip(tripId?: string) {
  const { data: session } = useSession();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrips = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/trips");
      const data = await res.json();
      setTrips(data.trips ?? []);
    } catch {
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const fetchTrip = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      setTrip(data.trip);
      return data.trip;
    } catch {
      toast.error("Failed to load trip");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTrip = useCallback(
    async (input: CreateTripInput): Promise<Trip | null> => {
      try {
        const res = await fetch("/api/trips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error ?? "Failed to create trip");
          return null;
        }

        const data = await res.json();
        toast.success("Trip created!");
        setTrips((prev) => [data.trip, ...prev]);
        return data.trip;
      } catch {
        toast.error("Something went wrong");
        return null;
      }
    },
    []
  );

  const deleteTrip = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!res.ok) return false;
      toast.success("Trip deleted");
      setTrips((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch {
      toast.error("Failed to delete trip");
      return false;
    }
  }, []);

  // Caller is responsible for invoking fetch on mount or when tripId changes
  const refetch = tripId ? () => fetchTrip(tripId) : fetchTrips;

  return {
    trip,
    trips,
    loading,
    createTrip,
    deleteTrip,
    fetchTrips,
    fetchTrip,
    refetch,
  };
}
