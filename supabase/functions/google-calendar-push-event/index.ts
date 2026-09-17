// Pushes a single local event change up to the user's primary Google Calendar.
//
// Body variants:
//   { action: "push_local", event_id: string }
//     - Reads the local event. If it has no external_id → POST to Google, save
//       the returned id back into calendar_events.external_id + set account_id.
//     - If it has an external_id → PATCH the existing Google event.
//
//   { action: "delete", event_id: string }
//     - Reads the local event (to get external_id + account_id).
//     - If external_id present: DELETE on Google (404/410 tolerated).
//     - Then deletes the local row.
//
// If no Google account is connected, both actions no-op (except delete which
// still removes the local row).

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
  google_calendar_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  expires_at: string;
}

interface LocalEvent {
  id: string;
  user_id: string;
  account_id: string | null;
  external_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
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

    const body = (await req.json()) as { action?: "push_local" | "delete"; event_id?: string };
    if (!body.action || !body.event_id) return json({ error: "action and event_id required" }, 400);

    // Fetch the local event (must belong to this user)
    const { data: eventData, error: eventErr } = await admin
      .from("calendar_events")
      .select("*")
      .eq("id", body.event_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (eventErr) return json({ error: eventErr.message }, 500);
    if (!eventData) return json({ error: "Event not found" }, 404);
    const event = eventData as LocalEvent;

    // Fetch the user's Google account (may be null)
    const { data: accountData } = await admin
      .from("calendar_accounts")
      .select("id, google_calendar_id, access_token_encrypted, refresh_token_encrypted, expires_at")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();
    let account = accountData as CalendarAccount | null;

    if (body.action === "delete") {
      // Try Google first (best-effort), then delete local.
      if (account && event.external_id) {
        account = await ensureFreshToken(admin, account);
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(account.google_calendar_id)}/events/${encodeURIComponent(event.external_id)}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${account.access_token_encrypted}` } },
        );
        // 200/204 = success. 404/410 = already gone (tolerate).
        if (!res.ok && res.status !== 404 && res.status !== 410) {
          const detail = await res.text();
          return json({ error: `Google delete failed: ${res.status} ${detail}` }, 502);
        }
      }
      const { error: delErr } = await admin.from("calendar_events").delete().eq("id", event.id);
      if (delErr) return json({ error: delErr.message }, 500);
      return json({ ok: true, pushed: !!(account && event.external_id) });
    }

    // action === "push_local"
    if (!account) return json({ ok: true, skipped: "no-google-account" });
    account = await ensureFreshToken(admin, account);

    const googleBody = mapLocalToGoogle(event);

    if (event.external_id) {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(account.google_calendar_id)}/events/${encodeURIComponent(event.external_id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${account.access_token_encrypted}`,
          },
          body: JSON.stringify(googleBody),
        },
      );
      if (!res.ok) {
        const detail = await res.text();
        return json({ error: `Google update failed: ${res.status} ${detail}` }, 502);
      }
      return json({ ok: true, action: "patched", external_id: event.external_id });
    }

    // Create on Google, then save the returned id locally
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(account.google_calendar_id)}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${account.access_token_encrypted}`,
        },
        body: JSON.stringify(googleBody),
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      return json({ error: `Google create failed: ${res.status} ${detail}` }, 502);
    }
    const created = (await res.json()) as { id: string };
    const { error: updErr } = await admin
      .from("calendar_events")
      .update({ external_id: created.id, account_id: account.id })
      .eq("id", event.id);
    if (updErr) return json({ error: `DB link failed: ${updErr.message}` }, 500);
    return json({ ok: true, action: "created", external_id: created.id });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

async function ensureFreshToken(admin: any, account: CalendarAccount): Promise<CalendarAccount> {
  const expiresMs = new Date(account.expires_at).getTime();
  if (expiresMs - Date.now() > 60_000) return account;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: account.refresh_token_encrypted,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh Google access token");
  const j = (await res.json()) as { access_token: string; expires_in: number };
  const nextExpires = new Date(Date.now() + j.expires_in * 1000).toISOString();
  await admin
    .from("calendar_accounts")
    .update({ access_token_encrypted: j.access_token, expires_at: nextExpires })
    .eq("id", account.id);
  return { ...account, access_token_encrypted: j.access_token, expires_at: nextExpires };
}

function mapLocalToGoogle(event: LocalEvent) {
  if (event.all_day) {
    // Local storage convention: noon UTC on the inclusive last day.
    // Google requires end.date to be EXCLUSIVE (day after the last day).
    const startDate = event.starts_at.slice(0, 10);
    const endInclusive = new Date(event.ends_at);
    endInclusive.setUTCDate(endInclusive.getUTCDate() + 1);
    const endDate = endInclusive.toISOString().slice(0, 10);
    return {
      summary: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: { date: startDate },
      end: { date: endDate },
    };
  }
  return {
    summary: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: { dateTime: event.starts_at },
    end: { dateTime: event.ends_at },
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
