import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queries } from "@lio/core";
import type { CalendarEventInput } from "@lio/core/schemas/calendar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import type { CalendarAccountRow } from "./useGoogleCalendar";

export interface CalendarEventRow {
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
  created_at: string;
  updated_at: string;
}

const googleAccountKey = ["calendar", "account", "google"] as const;

function hasGoogleAccount(qc: QueryClient): boolean {
  const cached = qc.getQueryData<CalendarAccountRow | null>(googleAccountKey);
  return !!cached;
}

// Fire-and-await Google push; failure toasts but does not roll back local.
async function pushToGoogle(
  action: "push_local" | "delete",
  eventId: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("google-calendar-push-event", {
    body: { action, event_id: eventId },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

export function useEventsInRange(fromIso: string, toIso: string) {
  return useQuery({
    queryKey: queries.keys.calendar.range(fromIso, toIso),
    queryFn: async () => (await api.calendar.listEventsInRange(supabase, fromIso, toIso)) as CalendarEventRow[],
    placeholderData: (prev) => prev,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CalendarEventInput) => {
      if (!user) throw new Error("Not authenticated");
      const created = await api.calendar.createEvent(supabase, { ...input, user_id: user.id });
      if (hasGoogleAccount(qc)) {
        try {
          await pushToGoogle("push_local", (created as { id: string }).id);
        } catch (e) {
          toast.error(`Saved locally but Google push failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.calendar.all });
      toast.success("Event added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CalendarEventInput> }) => {
      const { data, error } = await supabase.from("calendar_events").update(patch).eq("id", id).select().single();
      if (error) throw error;
      if (hasGoogleAccount(qc)) {
        try {
          await pushToGoogle("push_local", id);
        } catch (e) {
          toast.error(`Saved locally but Google push failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.calendar.all });
      toast.success("Event updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (hasGoogleAccount(qc)) {
        // Server does both: Google delete + local delete (atomic).
        await pushToGoogle("delete", id);
      } else {
        // No Google account — just remove locally.
        await api.calendar.deleteEvent(supabase, id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.calendar.all });
      toast.success("Event deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
