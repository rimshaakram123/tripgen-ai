# TripGen AI — Windows quick start

This build uses **OpenRouter** for AI. Ollama is not required.

## 1. Install dependencies

```powershell
npm install
```

## 2. Create `.env`

Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Open `.env` and fill in:

- `DATABASE_URL` — your Supabase Session Pooler URI
- `NEXTAUTH_SECRET` — a private random secret
- `OPENROUTER_API_KEY` — the full key from your OpenRouter dashboard
- `OPENWEATHER_API_KEY` — optional

Do not paste API keys into chat, screenshots, GitHub, or public files.

Generate a NextAuth secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. Run the built-in configuration check

```powershell
npm run doctor
```

## 4. Sync Prisma / Supabase

```powershell
npm run db:push
```

## 5. Start TripGen

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

AI status:

```text
http://localhost:3000/api/ai/status
```

A healthy AI setup reports `available: true` and `activeProvider: "openrouter"`.

## Normal daily startup

After the first setup, you only need:

```powershell
npm run dev
```

There is no Ollama terminal or local model to start.
