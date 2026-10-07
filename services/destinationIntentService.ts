import { z } from "zod";

import { aiChat } from "@/services/aiProviderService";
import { parseAIJson } from "@/lib/aiJson";

const destinationIntentSchema = z.object({
  destination: z.string().nullable(),
  specificity: z.enum(["city", "town", "island", "region", "country", "unknown"]),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().nullable(),
});

export type DestinationIntent = z.infer<typeof destinationIntentSchema> & {
  source: "openrouter" | "raw";
};

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function looksLikePlainPlaceName(value: string): boolean {
  const text = normalizeWhitespace(value);
  if (!text) return false;

  // Short inputs such as "Chengdu", "Tokyo Japan", or "Paris, France"
  // should go straight to the geocoder without spending an AI request.
  const words = text.split(/\s+/);
  const sentenceMarkers = /\b(i|we|want|wanna|would|like|going|go|visit|travel|trip|take|plan|somewhere|place|city|near|around)\b/i;
  const arabicSentenceMarkers = /(أريد|اريد|أبغى|ابغى|ودي|أروح|اروح|أسافر|اسافر|رحلة|مكان|مدينة|حول|قريب)/;

  return words.length <= 4 && !sentenceMarkers.test(text) && !arabicSentenceMarkers.test(text);
}

export function shouldUseDestinationAI(input: string): boolean {
  return !looksLikePlainPlaceName(input);
}

export async function resolveDestinationIntent(input: string): Promise<DestinationIntent> {
  const raw = normalizeWhitespace(input);
  if (!raw) {
    return {
      destination: null,
      specificity: "unknown",
      confidence: 0,
      needsClarification: true,
      clarificationQuestion: "Where would you like to travel?",
      source: "raw",
    };
  }

  try {
    const result = await aiChat({
      messages: [
        {
          role: "system",
          content:
            "You extract travel destinations from natural-language user input. Never invent a city that the user did not name or clearly imply. If the input only gives a broad country/region or no location, set needsClarification=true. Return only structured JSON.",
        },
        {
          role: "user",
          content: `Understand the travel destination in this message:\n\n${raw}\n\nRules:\n- If a specific city/town/island is explicitly present, normalize it to a geocodable name such as \"Chengdu, China\" or \"Tokyo, Japan\".\n- Understand informal English, Arabic, misspellings when reasonably clear, and conversational wording.\n- Do NOT choose a city just because a country was mentioned.\n- If the user says only something broad such as \"China\", return that destination but set needsClarification=true.\n- If there is no destination, destination=null and needsClarification=true.\n- clarificationQuestion should be short and natural, or null when no clarification is needed.`,
        },
      ],
      format: z.toJSONSchema(destinationIntentSchema),
      temperature: 0,
      numPredict: 120,
      timeoutMs: 60_000,
    });

    const parsed = destinationIntentSchema.parse(parseAIJson(result.content));
    return { ...parsed, source: result.provider };
  } catch (error) {
    console.warn(
      `[TripGen Destination] Natural-language AI resolution failed; using raw input: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return {
      destination: raw,
      specificity: "unknown",
      confidence: 0.25,
      needsClarification: false,
      clarificationQuestion: null,
      source: "raw",
    };
  }
}
