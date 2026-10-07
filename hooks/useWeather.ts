"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

import type { WeatherData, WeatherForecast } from "@/types/weather";

export function useWeather() {
  const [current, setCurrent] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = useCallback(async (location: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weather?location=${encodeURIComponent(location)}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCurrent(data.current);
      return data.current;
    } catch {
      toast.error("Failed to load weather data");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchForecast = useCallback(
    async (location: string, days: number = 5) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/weather/forecast?location=${encodeURIComponent(location)}&days=${days}`
        );
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setForecast(data.forecast);
        return data.forecast;
      } catch {
        toast.error("Failed to load forecast");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    current,
    forecast,
    loading,
    fetchWeather,
    fetchForecast,
  };
}
