import type { LioClient } from "../supabase";
import type { CalendarEventInput } from "../schemas/calendar";

export async function listEventsInRange(client: LioClient, fromIso: string, toIso: string) {
  const { data, error } = await client
    .from("calendar_events")
    .select("*")
    .gte("starts_at", fromIso)
    .lte("ends_at", toIso)
    .order("starts_at");
  if (error) throw error;
  return data;
}

export async function createEvent(client: LioClient, input: CalendarEventInput & { user_id: string; account_id?: string | null }) {
  const { data, error } = await client.from("calendar_events").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(client: LioClient, id: string) {
  const { error } = await client.from("calendar_events").delete().eq("id", id);
  if (error) throw error;
}
