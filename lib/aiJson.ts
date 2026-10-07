/**
 * Parses JSON returned by an LLM defensively.
 * Structured-output providers normally return plain JSON, but some free models
 * may still wrap the object in a markdown fence or a small amount of prose.
 */
export function parseAIJson<T = unknown>(content: string): T {
  const trimmed = content.trim();

  const attempts = [
    trimmed,
    trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim(),
  ];

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    attempts.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  let lastError: unknown;
  for (const candidate of Array.from(new Set(attempts))) {
    try {
      return JSON.parse(candidate) as T;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `AI returned invalid JSON${lastError instanceof Error ? `: ${lastError.message}` : ""}`
  );
}
