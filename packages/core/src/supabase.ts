import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// LioClient is untyped until `pnpm supabase:types` regenerates
// packages/core/src/types/supabase.ts against the live DB. Once that runs,
// swap this to `SupabaseClient<Database>` (import from ./types/supabase) and
// every .from() call will be strictly typed against the schema.
export type LioClient = SupabaseClient;

export interface CreateClientOptions {
  url: string;
  anonKey: string;
  storage?: {
    getItem: (key: string) => string | null | Promise<string | null>;
    setItem: (key: string, value: string) => void | Promise<void>;
    removeItem: (key: string) => void | Promise<void>;
  };
}

export function createLioClient({ url, anonKey, storage }: CreateClientOptions): LioClient {
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage,
    },
  });
}
