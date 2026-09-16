# Life in One

Personal Life OS — a multipurpose life management dashboard: tasks, calendar, journal, budget, goals, health, and Bible notes. React web app now, React Native to follow. Shared business logic lives in `@lio/core` so both clients import the same API layer, types, and validation.

## Stack

- **Web:** React 18 + Vite + TypeScript, React Router, TanStack Query + Zustand, Tailwind + shadcn/ui, React Hook Form + Zod
- **Backend:** Supabase (Postgres + Auth + RLS + Realtime + Storage + Edge Functions)
- **Shared:** `packages/core` — framework-agnostic API wrappers, Zod schemas, TS types, query keys, integrations

## Layout

```
packages/core   # shared with future React Native app
packages/web    # React 18 + Vite web app
supabase/       # migrations, edge functions, local config
```

## Prerequisites

- Node 20+ (nvm: `nvm use`)
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- [Supabase CLI](https://supabase.com/docs/guides/local-development) for local Postgres/Auth

## Setup

```bash
pnpm install
cp .env.example .env         # fill in Supabase + Google + Bible keys
supabase start               # boots local Postgres + Auth + Studio
pnpm supabase:types          # generate typed DB client into packages/core
pnpm dev                     # http://localhost:5173
```

## Obtaining API credentials

### Supabase (required)
- Local dev: values printed by `supabase start` (URL is `http://127.0.0.1:54321`).
- Hosted: [supabase.com](https://supabase.com) → New project → Settings → API → copy **Project URL** and **anon public** key.

### Google Calendar OAuth (for Calendar module)
1. [Google Cloud Console](https://console.cloud.google.com) → create project.
2. APIs & Services → Library → enable **Google Calendar API**.
3. Credentials → **Create OAuth client ID** → Web application.
4. Authorized redirect URIs: `http://localhost:5173/auth/google/callback` (add prod URL later).
5. Copy the Client ID into `VITE_GOOGLE_CLIENT_ID`. Set the client secret as a Supabase secret used by the `google-calendar-sync` edge function: `supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...`.

### Bible API (for Bible Journal module)
- **api.bible** (recommended): [scripture.api.bible](https://scripture.api.bible) → free key → set `VITE_BIBLE_API_KEY`.
- **bible-api.com** fallback: no key required — leave `VITE_BIBLE_API_KEY` blank.

### Health provider (v2)
- v1 uses **manual entry only** — no API credential needed.
- Google Fit REST API is deprecated (end of 2026, closed to new signups since 2024-05-01). When ready, integrate the [Google Health API](https://developers.google.com/health) (successor to the Fitbit Web API).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run the web app (Vite) |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm supabase:start` | Boot local Supabase stack |
| `pnpm supabase:reset` | Reset local DB and re-run migrations + seed |
| `pnpm supabase:types` | Regenerate `packages/core/src/types/supabase.ts` from the local DB |

## Database

All application tables live in `public`. Every table has RLS enabled with policies gating rows on `user_id = auth.uid()`. Migrations are in `supabase/migrations/`.

## Modules (build order)

1. Auth + accounts + theming
2. Dashboard shell + navigation
3. To-Do → Calendar → Journal → Budget → Goals → Health → Bible Journal

Each module is finished end-to-end before the next starts.
