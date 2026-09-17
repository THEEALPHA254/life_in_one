# Life in One — Mobile

React Native app (Expo, managed workflow) sharing `@lio/core` with the web app.

## Setup

From the **workspace root** (`life_in_one/`):

```bash
pnpm install
```

Then in this package:

```bash
cp .env.example .env
```

Edit `packages/mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://mluqlltuspommpxojbeb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon key — same value as the web app's .env>
```

(Same Supabase project — auth accounts and data are shared between web + mobile.)

## Run in Expo Go (fastest — no build needed)

Install **Expo Go** from Play Store on your Android phone.

Then, in `packages/mobile/`:

```bash
pnpm start
```

A QR code appears in the terminal. Scan it with Expo Go (or the phone camera on newer Androids) and the app loads on your phone.

Iterate: edit any file, save, phone reloads automatically.

## Building an installable APK (later — needs a free Expo account)

Expo Go is great for dev but for a real installable APK you use **EAS Build** (free tier includes 30 Android builds/month).

```bash
npm install -g eas-cli
eas login          # create free account at expo.dev
eas build:configure
eas build --platform android --profile preview
```

The `preview` profile produces an APK you can download from your Expo dashboard and sideload onto any Android phone. `production` profile produces AAB for Play Store submission.

## Structure

- `app/` — Expo Router file-based routes
  - `_layout.tsx` — root providers (Query, Auth) + Toaster
  - `index.tsx` — auth-gate redirect to /(auth)/login or /(app)
  - `(auth)/{login,register}.tsx`
  - `(app)/_layout.tsx` — bottom tabs (Home / Tasks / Calendar / Journal / More)
  - `(app)/{index,tasks,calendar,journal,budget,goals,health,bible,settings,more}.tsx`
- `lib/supabase.ts` — Supabase client (AsyncStorage session persistence)
- `providers/` — QueryProvider, AuthProvider
- `components/` — shared UI
- Configs: `app.json` (Expo), `babel.config.js` (Expo preset + NativeWind), `metro.config.js` (monorepo-aware), `tailwind.config.js` + `global.css` (NativeWind)

## Phase roadmap

- **Phase 1 (this)** — Auth + tab shell + placeholder screens
- **Phase 2** — Tasks (list, form, filter)
- **Phase 3** — Journal (rich text on mobile: tentap-editor or plain markdown)
- **Phase 4** — Calendar + Google sync (reuses the deployed edge functions as-is)
- **Phase 5** — Budget + Goals
- **Phase 6** — Health + Bible
- **Phase 7** — Native push notifications

## Reused from web (via `@lio/core`)

Zod schemas, TanStack query keys, api wrappers, Zustand stores, integrations (bible-api). Same source-of-truth for validation and API shape.

## Platform-specific swaps

- Tiptap → `@10play/tentap-editor` (or plain markdown) for journal/bible
- Recharts → `victory-native` or `react-native-svg-charts` for budget/health
- react-day-picker → `react-native-calendars` for calendar
