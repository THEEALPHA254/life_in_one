// Mirrors packages/web/src/features/calendar/hooks/useGoogleCalendar.ts —
// same TanStack keys so cache is coordinated across web + mobile. The OAuth
// initiate step (beginGoogleOAuth) is web-only; mobile users connect on web,
// then sync/disconnect from either client works identically.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queries } from "@lio/core";
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
      if (vars?.silent) return;
      toast.error(`Sync failed: ${e.message}`);
    },
  });
}
