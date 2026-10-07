export type WeatherCondition =
  | "clear"
  | "clouds"
  | "rain"
  | "thunderstorm"
  | "snow"
  | "mist"
  | "fog";

export type WeatherData = {
  location: string;
  temperature: number;
  feelsLike: number;
  condition: WeatherCondition;
  description: string;
  humidity: number;
  windSpeed: number;
  date: string;
  sunrise?: string;
  sunset?: string;
  available?: boolean;
  source?: "openweather" | "unavailable";
};

export type WeatherForecast = {
  location: string;
  forecast: WeatherData[];
  available?: boolean;
  source?: "openweather" | "unavailable";
};

export type WeatherAdaptation = {
  originalActivity: string;
  replacementActivity: string;
  reason: string;
  day: number;
};
