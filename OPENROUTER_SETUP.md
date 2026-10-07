# TripGen AI — OpenRouter setup

TripGen now uses **OpenRouter only** for cloud AI. Ollama and SiliconFlow have been removed from the project.

## 1. Create your API key

Create an API key in your OpenRouter dashboard. Never commit or share the full key.

## 2. Configure `.env`

Copy `.env.example` to `.env`, then set:

```env
OPENROUTER_ENABLED="true"
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
OPENROUTER_MODEL="openrouter/free"
OPENROUTER_TIMEOUT_MS="60000"
OPENROUTER_SITE_URL="http://localhost:3000"
OPENROUTER_APP_NAME="TripGen AI"
```

`openrouter/free` keeps the project on free model routing and lets OpenRouter choose a free model that supports the request. You may replace it with any currently available `:free` model slug later.

## 3. Verify the connection

Run TripGen and open:

```text
http://localhost:3000/api/ai/status
```

Expected shape:

```json
{
  "primary": "openrouter",
  "enabled": true,
  "available": true,
  "activeProvider": "openrouter"
}
```

## Security

Keep `.env` out of Git. If an API key is ever exposed publicly, revoke it in OpenRouter and create a new one.
