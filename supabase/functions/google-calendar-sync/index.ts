// Stub — implemented in the Calendar module milestone.
// Runs on a schedule (or webhook) to pull Google Calendar events into
// public.calendar_events and push local changes back up, keyed by sync_token.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(() => new Response("google-calendar-sync: not implemented", { status: 501 }));
