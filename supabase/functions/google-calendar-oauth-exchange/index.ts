// Trades a Google OAuth authorization code for access + refresh tokens,
// stores them in public.calendar_accounts, and returns success to the web app.
//
// Env (set via `supabase secrets set`):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   SUPABASE_URL              (auto-provided)
//   SUPABASE_ANON_KEY         (auto-provided)
//   SUPABASE_SERVICE_ROLE_KEY (auto-provided)

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — runs in Deno, not the web tsconfig
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

    const body = (await req.json()) as { code?: string; redirect_uri?: string };
    if (!body.code || !body.redirect_uri) return json({ error: "code and redirect_uri required" }, 400);

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: body.code,
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        redirect_uri: body.redirect_uri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      return json({ error: `Google token exchange failed: ${detail}` }, 400);
    }
    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
      token_type: string;
    };
    if (!tokens.refresh_token) {
      // Refresh token is only returned on first consent. If a user reconnects
      // without revoking, Google won't return one — we can't sync long-term.
      return json({
        error: "Google did not return a refresh_token. Revoke this app at https://myaccount.google.com/permissions and try again.",
      }, 400);
    }

    // Fetch the primary calendar so we know which one to sync
    const calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList/primary",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );
    if (!calRes.ok) {
      const detail = await calRes.text();
      return json({ error: `Failed to fetch primary calendar: ${detail}` }, 400);
    }
    const cal = (await calRes.json()) as { id: string; summary?: string };

    // Store — use service_role client so RLS doesn't block the insert
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Upsert by (user_id, provider) — do it manually since there's no unique constraint
    const { data: existing } = await admin
      .from("calendar_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();

    const payload = {
      user_id: userId,
      provider: "google",
      google_calendar_id: cal.id,
      access_token_encrypted: tokens.access_token,    // TODO: encrypt with pgsodium
      refresh_token_encrypted: tokens.refresh_token,
      expires_at: expiresAt,
      sync_token: null as string | null,               // reset — force full pull on next sync
    };

    if (existing) {
      const { error } = await admin.from("calendar_accounts").update(payload).eq("id", existing.id);
      if (error) return json({ error: `DB update failed: ${error.message}` }, 500);
    } else {
      const { error } = await admin.from("calendar_accounts").insert(payload);
      if (error) return json({ error: `DB insert failed: ${error.message}` }, 500);
    }

    return json({ ok: true, calendar_id: cal.id, calendar_summary: cal.summary ?? null });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
