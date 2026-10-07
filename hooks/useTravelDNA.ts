"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

import type { TravelDNA, DNADimension } from "@/types/travelDNA";
import { calculateDNA, getPersonalityType } from "@/lib/travelDNAUtils";

export function useTravelDNA() {
  const { data: session } = useSession();
  const [dna, setDna] = useState<TravelDNA | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDNA = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/travel-dna");
      if (!res.ok) return;
      const data = await res.json();
      setDna(data.dna ?? null);
      return data.dna;
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const saveDNA = useCallback(
    async (answers: { category: DNADimension }[]): Promise<boolean> => {
      const calculated = calculateDNA(answers);

      try {
        const res = await fetch("/api/travel-dna", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(calculated),
        });

        if (!res.ok) {
          toast.error("Failed to save your Travel DNA");
          return false;
        }

        const personality = getPersonalityType(calculated);
        const dnaWithPersonality = { ...calculated, personality: personality.type };

        setDna(dnaWithPersonality);
        toast.success(`You are ${personality.type}!`);
        return true;
      } catch {
        toast.error("Something went wrong");
        return false;
      }
    },
    []
  );

  return {
    dna,
    loading,
    fetchDNA,
    saveDNA,
  };
}
