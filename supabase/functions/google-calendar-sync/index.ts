// Pulls events from the user's primary Google Calendar into public.calendar_events.
//
// - Refreshes the access token if it will expire in the next 60s.
// - On first sync (no sync_token): full-window pull (30 days back, 365 forward).
// - On subsequent syncs: incremental via nextSyncToken from Google.
// - If Google returns 410 Gone (sync token invalidated), transparently redoes a full pull.
// - Uses `singleEvents=true` so recurring events come pre-expanded — no RRULE handling required.
// - Cancelled events → delete local row keyed by external_id.
//
// Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, plus the auto Supabase vars.

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — runs in Deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CalendarAccount {
  id: string;
  user_id: string;
  google_calendar_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  expires_at: string;
  sync_token: string | null;
}

interface GEvent {
  id: string;
  status?: "confirmed" | "cancelled" | "tentative";
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?:   { dateTime?: string; date?: string; timeZone?: string };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: account, error: accErr } = await admin
      .from("calendar_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();
    if (accErr) return json({ error: accErr.message }, 500);
    if (!account) return json({ error: "No Google Calendar connected" }, 404);

    let acc = account as CalendarAccount;

    // Refresh access token if it expires within 60s
    const expiresMs = new Date(acc.expires_at).getTime();
    if (expiresMs - Date.now() < 60_000) {
      const refreshed = await refreshAccessToken(acc.refresh_token_encrypted);
      if (!refreshed) return json({ error: "Refresh failed — please reconnect Google Calendar" }, 401);
      acc = { ...acc, access_token_encrypted: refreshed.access_token, expires_at: refreshed.expires_at };
      await admin
        .from("calendar_accounts")
        .update({
          access_token_encrypted: refreshed.access_token,
          expires_at: refreshed.expires_at,
        })
        .eq("id", acc.id);
    }

    // Pull events (handling pagination + sync-token invalidation)
    let syncTokenToUse = acc.sync_token;
    let result;
    try {
      result = await pullEvents(acc.google_calendar_id, acc.access_token_encrypted, syncTokenToUse);
    } catch (err) {
      if (err instanceof SyncTokenInvalid) {
        // Full re-sync
        result = await pullEvents(acc.google_calendar_id, acc.access_token_encrypted, null);
      } else {
        throw err;
      }
    }

    // Apply changes to DB
    let upserted = 0;
    let deleted = 0;
    for (const event of result.events) {
      if (event.status === "cancelled") {
        const { error } = await admin
          .from("calendar_events")
          .delete()
          .eq("account_id", acc.id)
          .eq("external_id", event.id);
        if (!error) deleted += 1;
        continue;
      }
      const mapped = mapGoogleEvent(event, userId, acc.id);
      if (!mapped) continue;
      const { error } = await admin
        .from("calendar_events")
        .upsert(mapped, { onConflict: "account_id,external_id" });
      if (!error) upserted += 1;
    }

    // Persist new sync token
    if (result.nextSyncToken) {
      await admin.from("calendar_accounts").update({ sync_token: result.nextSyncToken }).eq("id", acc.id);
    }

    return json({ ok: true, upserted, deleted, incremental: !!syncTokenToUse });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

class SyncTokenInvalid extends Error {}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_at: string } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { access_token: string; expires_in: number };
  return {
    access_token: j.access_token,
    expires_at: new Date(Date.now() + j.expires_in * 1000).toISOString(),
  };
}

async function pullEvents(
  calendarId: string,
  accessToken: string,
  syncToken: string | null,
): Promise<{ events: GEvent[]; nextSyncToken: string | null }> {
  const events: GEvent[] = [];
  let pageToken: string | null = null;
  let nextSyncToken: string | null = null;

  do {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    );
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("maxResults", "250");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    } else if (syncToken) {
      url.searchParams.set("syncToken", syncToken);
    } else {
      // Full-window initial sync
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const oneYearAhead = new Date(Date.now() + 365 * 86_400_000).toISOString();
      url.searchParams.set("timeMin", thirtyDaysAgo);
      url.searchParams.set("timeMax", oneYearAhead);
      url.searchParams.set("showDeleted", "false");
      url.searchParams.set("orderBy", "startTime");
    }

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    if (res.status === 410) throw new SyncTokenInvalid("sync token expired");
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Google API ${res.status}: ${detail}`);
    }
    const page = (await res.json()) as {
      items?: GEvent[];
      nextPageToken?: string;
      nextSyncToken?: string;
    };
    if (page.items) events.push(...page.items);
    pageToken = page.nextPageToken ?? null;
    if (page.nextSyncToken) nextSyncToken = page.nextSyncToken;
  } while (pageToken);

  return { events, nextSyncToken };
}

function mapGoogleEvent(event: GEvent, userId: string, accountId: string) {
  const isAllDay = !event.start?.dateTime;
  let startsAt: string | null;
  let endsAt: string | null;
  if (isAllDay) {
    if (!event.start?.date || !event.end?.date) return null;
    // Google represents all-day events with `end.date` EXCLUSIVE (day after the
    // last day). Store both bounds as noon UTC on their respective inclusive
    // date to avoid timezone-shift day boundaries.
    startsAt = `${event.start.date}T12:00:00Z`;
    const endExclusive = new Date(`${event.end.date}T00:00:00Z`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() - 1);
    endsAt = `${endExclusive.toISOString().slice(0, 10)}T12:00:00Z`;
  } else {
    startsAt = event.start?.dateTime ?? null;
    endsAt = event.end?.dateTime ?? null;
  }
  if (!startsAt || !endsAt) return null;
  return {
    user_id: userId,
    account_id: accountId,
    external_id: event.id,
    title: event.summary ?? "(no title)",
    description: event.description ?? null,
    location: event.location ?? null,
    starts_at: startsAt,
    ends_at: endsAt,
    all_day: !event.start?.dateTime,
    updated_at: new Date().toISOString(),
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
