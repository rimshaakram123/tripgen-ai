import { NextResponse } from "next/server";

import { getWeatherForecast } from "@/services/weatherService";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get("location");
  const days = parseInt(searchParams.get("days") ?? "5", 10);

  if (!location) {
    return NextResponse.json(
      { error: "Location parameter is required" },
      { status: 400 }
    );
  }

  const forecast = await getWeatherForecast(location, days);

  return NextResponse.json({ forecast });
}
