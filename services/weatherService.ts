import type { WeatherData, WeatherForecast, WeatherCondition } from "@/types/weather";

const WEATHER_TIMEOUT_MS = Number(process.env.WEATHER_TIMEOUT_MS || 5_000);

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function fetchWeatherJson(url: string): Promise<unknown | null> {
  const { signal, clear } = withTimeout(WEATHER_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal,
    });
    if (!response.ok) {
      console.warn(`[TripGen Weather] OpenWeather returned HTTP ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(
      `[TripGen Weather] Weather request failed; continuing without live weather: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  } finally {
    clear();
  }
}

export async function getCurrentWeather(location: string): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();

  if (!apiKey) {
    return unavailableWeather(location);
  }

  const payload = await fetchWeatherJson(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`
  );

  if (!payload || typeof payload !== "object") return unavailableWeather(location);
  const data = payload as {
    main?: { temp?: number; feels_like?: number; humidity?: number };
    weather?: Array<{ main?: string; description?: string }>;
    wind?: { speed?: number };
    sys?: { sunrise?: number; sunset?: number };
  };

  if (!data.main || !data.weather?.[0]) return unavailableWeather(location);

  return {
    location,
    temperature: Math.round(data.main.temp ?? 0),
    feelsLike: Math.round(data.main.feels_like ?? data.main.temp ?? 0),
    condition: mapCondition(data.weather[0].main ?? "clear"),
    description: data.weather[0].description ?? "Weather available",
    humidity: data.main.humidity ?? 0,
    windSpeed: Math.round(data.wind?.speed ?? 0),
    date: new Date().toISOString().split("T")[0],
    sunrise: data.sys?.sunrise
      ? new Date(data.sys.sunrise * 1000).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : undefined,
    sunset: data.sys?.sunset
      ? new Date(data.sys.sunset * 1000).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : undefined,
    available: true,
    source: "openweather",
  };
}

export async function getWeatherForecast(
  location: string,
  days: number = 5
): Promise<WeatherForecast> {
  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();

  // Weather is optional. Never block itinerary generation when no key exists.
  if (!apiKey) {
    return { location, forecast: [], available: false, source: "unavailable" };
  }

  const safeDays = Math.max(1, Math.min(7, Math.floor(days || 5)));
  const payload = await fetchWeatherJson(
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}&cnt=${safeDays * 8}`
  );

  if (!payload || typeof payload !== "object") {
    return { location, forecast: [], available: false, source: "unavailable" };
  }

  const data = payload as {
    list?: Array<{
      dt_txt?: string;
      main?: { temp?: number; feels_like?: number; humidity?: number };
      weather?: Array<{ main?: string; description?: string }>;
      wind?: { speed?: number };
    }>;
  };

  const forecast: WeatherData[] = [];
  const seenDates = new Set<string>();

  for (const item of data.list ?? []) {
    const date = item.dt_txt?.split(" ")[0];
    if (!date || seenDates.has(date)) continue;
    if (!item.main || !item.weather?.[0]) continue;
    seenDates.add(date);
    if (forecast.length >= safeDays) break;

    forecast.push({
      location,
      temperature: Math.round(item.main.temp ?? 0),
      feelsLike: Math.round(item.main.feels_like ?? item.main.temp ?? 0),
      condition: mapCondition(item.weather[0].main ?? "clear"),
      description: item.weather[0].description ?? "Weather available",
      humidity: item.main.humidity ?? 0,
      windSpeed: Math.round(item.wind?.speed ?? 0),
      date,
      available: true,
      source: "openweather",
    });
  }

  return {
    location,
    forecast,
    available: forecast.length > 0,
    source: forecast.length > 0 ? "openweather" : "unavailable",
  };
}

function mapCondition(apiCondition: string): WeatherCondition {
  const lower = apiCondition.toLowerCase();
  if (lower.includes("clear")) return "clear";
  if (lower.includes("cloud")) return "clouds";
  if (lower.includes("rain") || lower.includes("drizzle")) return "rain";
  if (lower.includes("thunder")) return "thunderstorm";
  if (lower.includes("snow")) return "snow";
  if (lower.includes("mist") || lower.includes("haze")) return "mist";
  if (lower.includes("fog")) return "fog";
  return "clear";
}

function unavailableWeather(location: string): WeatherData {
  return {
    location,
    temperature: 0,
    feelsLike: 0,
    condition: "clouds",
    description: "Live weather unavailable",
    humidity: 0,
    windSpeed: 0,
    date: new Date().toISOString().split("T")[0],
    available: false,
    source: "unavailable",
  };
}
