import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queries } from "@lio/core";
import type { CalendarEventInput } from "@lio/core/schemas/calendar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

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
      return api.calendar.createEvent(supabase, { ...input, user_id: user.id });
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
    mutationFn: async (id: string) => api.calendar.deleteEvent(supabase, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.keys.calendar.all });
      toast.success("Event deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
