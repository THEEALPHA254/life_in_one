import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queries, integrations } from "@lio/core";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export interface CalendarAccountRow {
  id: string;
  user_id: string;
  provider: string;
  google_calendar_id: string | null;
  sync_token: string | null;
  expires_at: string | null;
  created_at: string;
}

const accountKey = ["calendar", "account", "google"] as const;

export function useGoogleCalendarAccount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: accountKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_accounts")
        .select("id, user_id, provider, google_calendar_id, sync_token, expires_at, created_at")
        .eq("provider", "google")
        .maybeSingle();
      if (error) throw error;
      return data as CalendarAccountRow | null;
    },
  });
}

export function useDisconnectGoogleCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase.from("calendar_accounts").delete().eq("id", accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKey });
      qc.invalidateQueries({ queryKey: queries.keys.calendar.all });
      toast.success("Google Calendar disconnected");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

interface SyncResult {
  ok: true;
  upserted: number;
  deleted: number;
  incremental: boolean;
  silent?: boolean;
}

export function useSyncGoogleCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts?: { silent?: boolean }): Promise<SyncResult> => {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", { body: {} });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return { ...(data as SyncResult), silent: opts?.silent };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: queries.keys.calendar.all });
      qc.invalidateQueries({ queryKey: accountKey });
      if (result.silent) return;
      const label = result.incremental ? "Synced" : "Synced (full pull)";
      toast.success(`${label} — ${result.upserted} events`);
    },
    onError: (e: Error, vars) => {
      // Suppress error toast on silent auto-sync — user didn't ask, don't nag.
      if (vars?.silent) return;
      toast.error(`Sync failed: ${e.message}`);
    },
  });
}

export function beginGoogleOAuth() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    toast.error("VITE_GOOGLE_CLIENT_ID is not set. Add it to packages/web/.env and restart the dev server.");
    return;
  }
  const url = integrations.googleCalendar.buildGoogleOAuthUrl({
    clientId,
    redirectUri: `${window.location.origin}/auth/google/callback`,
  });
  window.location.href = url;
}
