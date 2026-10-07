import { NextResponse } from "next/server";

import { aiChat } from "@/services/aiProviderService";

const CONTEXT_PROMPT = `You are TripGen AI, a personalized travel assistant. You help travelers plan trips, adapt to changes, and discover experiences based on their Travel DNA profile. Be concise, friendly, practical, and actionable. Do not pretend you have live booking availability unless that data is explicitly provided.`;

function getFallbackResponse(message: string, tripContext?: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("weather") || lower.includes("rain")) {
    return "Live AI is unavailable right now, but TripGen can still use any available weather data to suggest indoor alternatives for rainy days.";
  }

  if (lower.includes("budget") || lower.includes("cheap") || lower.includes("afford")) {
    return tripContext
      ? "Live AI is unavailable right now. As a safe fallback, prioritize free attractions, local markets, public transport, and lower-cost meal stops in the current itinerary."
      : "Live AI is unavailable right now. Add a trip budget and TripGen can still prioritize lower-cost real places.";
  }

  if (lower.includes("food") || lower.includes("eat") || lower.includes("restaurant")) {
    return "Live AI is unavailable right now. TripGen can still rank verified food places from the destination data when you generate an itinerary.";
  }

  if (lower.includes("dna") || lower.includes("personality")) {
    return "Your Travel DNA scores adventure, culture, food, nature, photography, relaxation, nightlife, and budget preferences. TripGen uses those scores to rank real places.";
  }

  return "TripGen AI is temporarily unavailable. Your saved trips and real-place itinerary data are still safe, and you can retry the AI request shortly.";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const tripContext = typeof body.tripContext === "string" ? body.tripContext : undefined;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const result = await aiChat({
      messages: [
        { role: "system", content: CONTEXT_PROMPT },
        ...(tripContext
          ? [
              {
                role: "system" as const,
                content: `Current trip context:\n${tripContext.slice(0, 3500)}`,
              },
            ]
          : []),
        { role: "user", content: message },
      ],
      temperature: 0.3,
      timeoutMs: 60_000,
      numPredict: 220,
    });

    return NextResponse.json({
      response: result.content,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.warn(
      `[TripGen AI] Assistant providers failed; using safe fallback: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return NextResponse.json({
    response: getFallbackResponse(message, tripContext),
    provider: "fallback",
  });
}
