// Stubs for the Google Calendar OAuth start URL and event mapping.
// Full sync (exchange, refresh, incremental pull/push) happens in the
// supabase/functions/google-calendar-sync edge function.

export interface OAuthStartOptions {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
  state?: string;
}

export function buildGoogleOAuthUrl({ clientId, redirectUri, scopes, state }: OAuthStartOptions): string {
  const scopeList = scopes ?? [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: scopeList.join(" "),
  });
  if (state) params.set("state", state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
