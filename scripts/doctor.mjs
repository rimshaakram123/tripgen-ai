import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const root = process.cwd();
const envPath = path.join(root, ".env");

console.log("\nTripGen AI doctor\n");

if (!fs.existsSync(envPath)) {
  console.error("✗ .env is missing. Copy .env.example to .env first.");
  process.exit(1);
}

dotenv.config({ path: envPath, override: true });

const checks = [
  ["DATABASE_URL", process.env.DATABASE_URL, /YOUR_|PROJECT_REF|POOLER_HOST/],
  ["NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET, /YOUR_|generate-a-long-random-secret/],
  ["OPENROUTER_API_KEY", process.env.OPENROUTER_API_KEY, /YOUR_|sk-or-v1-YOUR_KEY/],
];

let valid = true;
for (const [name, value, placeholder] of checks) {
  const ok = Boolean(value && !placeholder.test(value));
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? " configured" : " needs a real value"}`);
  valid &&= ok;
}

console.log(`${process.env.OPENWEATHER_API_KEY ? "✓" : "•"} OPENWEATHER_API_KEY ${process.env.OPENWEATHER_API_KEY ? "configured" : "optional / not configured"}`);

if (!valid) {
  console.log("\nFix the required values in .env, then run npm run doctor again.\n");
  process.exit(1);
}

const baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 8_000);

try {
  const response = await fetch(`${baseUrl}/models`, {
    headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    signal: controller.signal,
  });
  console.log(`${response.ok ? "✓" : "✗"} OpenRouter connectivity ${response.ok ? "OK" : `failed (HTTP ${response.status})`}`);
  if (!response.ok) process.exitCode = 1;
} catch (error) {
  console.log(`✗ OpenRouter connectivity failed (${error instanceof Error ? error.message : "unknown error"})`);
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
}

console.log("\nIf all required checks are green, run: npm run db:push && npm run dev\n");
