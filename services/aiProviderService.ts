export type AIProviderName = "openrouter";

type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AIChatOptions = {
  messages: AIMessage[];
  format?: object | "json";
  temperature?: number;
  timeoutMs?: number;
  numPredict?: number;
};

export type AIChatResult = {
  content: string;
  provider: AIProviderName;
  model: string;
};

type OpenRouterResponse = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: { message?: string; code?: number | string } | string;
};

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openrouter/free";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getAIConfig() {
  return {
    primary: "openrouter" as const,
    openrouter: {
      enabled: process.env.OPENROUTER_ENABLED !== "false",
      apiKey: process.env.OPENROUTER_API_KEY?.trim() || "",
      baseUrl: normalizeBaseUrl(process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL),
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      timeoutMs: Math.max(8_000, Number(process.env.OPENROUTER_TIMEOUT_MS || 60_000)),
      siteUrl: process.env.OPENROUTER_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
      appName: process.env.OPENROUTER_APP_NAME || "TripGen AI",
    },
  };
}

export async function isOpenRouterAvailable(timeoutMs = 5_000): Promise<boolean> {
  const config = getAIConfig().openrouter;
  if (!config.enabled || !config.apiKey) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function buildResponseFormat(format?: object | "json") {
  if (format === "json") return { type: "json_object" };
  if (format && typeof format === "object") {
    return {
      type: "json_schema",
      json_schema: {
        name: "tripgen_response",
        strict: true,
        schema: format,
      },
    };
  }
  return undefined;
}

async function openRouterChat({
  messages,
  format,
  temperature = 0.2,
  timeoutMs,
  numPredict,
}: AIChatOptions): Promise<{ content: string; model: string }> {
  const config = getAIConfig().openrouter;
  if (!config.enabled) throw new Error("OpenRouter integration is disabled");
  if (!config.apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const controller = new AbortController();
  const requestTimeout = timeoutMs ?? config.timeoutMs;
  const timeout = setTimeout(() => controller.abort(), requestTimeout);
  const responseFormat = buildResponseFormat(format);

  const requestBody: Record<string, unknown> = {
    model: config.model,
    messages,
    stream: false,
    temperature,
    ...(numPredict ? { max_tokens: numPredict } : {}),
    ...(responseFormat ? { response_format: responseFormat } : {}),
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
    "HTTP-Referer": config.siteUrl,
    "X-Title": config.appName,
  };

  try {
    let response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      cache: "no-store",
      signal: controller.signal,
    });

    // Some free models support JSON mode but not strict JSON Schema. Retry gracefully.
    if (!response.ok && responseFormat?.type === "json_schema") {
      const firstPayload = (await response.json().catch(() => ({}))) as OpenRouterResponse;
      console.warn(
        `[TripGen AI] OpenRouter json_schema request failed (${response.status}): ${
          typeof firstPayload.error === "string"
            ? firstPayload.error
            : firstPayload.error?.message || "unknown error"
        }. Retrying with json_object.`
      );

      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...requestBody,
          response_format: { type: "json_object" },
        }),
        cache: "no-store",
        signal: controller.signal,
      });
    }

    const payload = (await response.json().catch(() => ({}))) as OpenRouterResponse;
    if (!response.ok) {
      const message =
        typeof payload.error === "string"
          ? payload.error
          : payload.error?.message || `HTTP ${response.status}`;
      throw new Error(`OpenRouter returned ${message}`);
    }

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("OpenRouter returned an empty response");

    return { content, model: payload.model || config.model };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`OpenRouter request timed out after ${requestTimeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function aiChat(options: AIChatOptions): Promise<AIChatResult> {
  const result = await openRouterChat(options);
  return { content: result.content, provider: "openrouter", model: result.model };
}

export async function getAIStatus() {
  const config = getAIConfig();
  const configured = Boolean(config.openrouter.enabled && config.openrouter.apiKey);
  const available = configured ? await isOpenRouterAvailable() : false;

  return {
    primary: "openrouter" as const,
    enabled: configured,
    available,
    activeProvider: available ? ("openrouter" as const) : null,
    model: config.openrouter.model,
    openrouter: {
      configured,
      available,
      model: config.openrouter.model,
      freeMode: config.openrouter.model === "openrouter/free" || config.openrouter.model.endsWith(":free"),
    },
    fallbackEnabled: false,
  };
}
