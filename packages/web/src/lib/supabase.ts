import { createLioClient } from "@lio/core";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "Supabase env vars missing. Copy .env.example → .env and fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createLioClient({
  url: url ?? "",
  anonKey: anonKey ?? "",
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
});
