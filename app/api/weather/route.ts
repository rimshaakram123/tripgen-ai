import { NextResponse } from "next/server";

import { getCurrentWeather } from "@/services/weatherService";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get("location");

  if (!location) {
    return NextResponse.json(
      { error: "Location parameter is required" },
      { status: 400 }
    );
  }

  const current = await getCurrentWeather(location);

  return NextResponse.json({ current });
}
