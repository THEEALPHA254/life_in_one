import type { LioClient } from "../supabase";
import type { BibleNoteInput, BibleVerseInput } from "../schemas/bible";

export async function listNotes(client: LioClient, opts: { limit?: number } = {}) {
  let q = client.from("bible_notes").select("*, verses:bible_note_verses(*)").order("service_date", { ascending: false, nullsFirst: false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function upsertNote(client: LioClient, input: BibleNoteInput & { user_id: string; id?: string }) {
  const { data, error } = await client
    .from("bible_notes")
    .upsert(input, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addVerseToNote(client: LioClient, noteId: string, verse: BibleVerseInput) {
  const { data, error } = await client
    .from("bible_note_verses")
    .insert({ ...verse, note_id: noteId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNote(client: LioClient, id: string) {
  const { error } = await client.from("bible_notes").delete().eq("id", id);
  if (error) throw error;
}
