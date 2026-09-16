import type { LioClient } from "../supabase";
import type { JournalEntryInput } from "../schemas/journal";

export async function listEntries(client: LioClient, opts: { limit?: number; search?: string } = {}) {
  let q = client.from("journal_entries").select("*").order("entry_date", { ascending: false });
  if (opts.limit) q = q.limit(opts.limit);
  if (opts.search) q = q.textSearch("content_text", opts.search, { type: "websearch", config: "english" });
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getEntryByDate(client: LioClient, entryDate: string) {
  const { data, error } = await client
    .from("journal_entries")
    .select("*")
    .eq("entry_date", entryDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertEntry(client: LioClient, input: JournalEntryInput & { user_id: string; id?: string }) {
  const { data, error } = await client
    .from("journal_entries")
    .upsert(input, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEntry(client: LioClient, id: string) {
  const { error } = await client.from("journal_entries").delete().eq("id", id);
  if (error) throw error;
}
