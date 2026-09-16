// Stub — implemented alongside provider integrations.
// Refreshes stored provider access tokens (Google Calendar, later Google Health)
// before they expire and updates the encrypted columns in calendar_accounts.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(() => new Response("oauth-refresh: not implemented", { status: 501 }));
