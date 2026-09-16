import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, integrations, queries } from "@lio/core";
import type { BibleNoteInput } from "@lio/core/schemas/bible";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { parseReference } from "../reference";

export interface BibleVerseRow {
  id: string;
  note_id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  translation: string;
  text: string | null;
}

export interface BibleNoteRow {
  id: string;
  user_id: string;
  service_date: string | null;
  service_title: string | null;
  speaker: string | null;
  content_json: unknown;
  content_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface BibleNoteWithVerses extends BibleNoteRow {
  verses: BibleVerseRow[];
}

const bibleConfig = {
  apiKey: import.meta.env.VITE_BIBLE_API_KEY || undefined,
  baseUrl: import.meta.env.VITE_BIBLE_API_BASE || undefined,
};

const noteKey = (id: string) => ["bible", "note", id] as const;

export function useNotes() {
  return useQuery({
    queryKey: queries.keys.bible.notes,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bible_notes")
        .select("*, verses:bible_note_verses(*)")
        .order("service_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BibleNoteWithVerses[];
    },
  });
}

export function useNote(id: string | null) {
  return useQuery({
    queryKey: id ? noteKey(id) : ["bible", "note", "none"],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("bible_notes")
        .select("*, verses:bible_note_verses(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as BibleNoteWithVerses;
    },
  });
}

// Content autosave — updates the note cache in place, no refetch (would
// interrupt typing, same trap as the Journal editor).
export function useSaveNote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: BibleNoteInput & { id?: string }) => {
      if (!user) throw new Error("Not authenticated");
      return (await api.bible.upsertNote(supabase, { ...input, user_id: user.id })) as BibleNoteRow;
    },
    onSuccess: (row) => {
      qc.setQueryData<BibleNoteWithVerses | null>(noteKey(row.id), (prev) => ({
        ...(row as BibleNoteRow),
        verses: prev?.verses ?? [],
      }));
      qc.invalidateQueries({ queryKey: queries.keys.bible.notes });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.bible.deleteNote(supabase, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bible"] });
      toast.success("Note deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddVerse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, reference }: { noteId: string; reference: string }) => {
      const parsed = parseReference(reference);
      if (!parsed) throw new Error(`Couldn't parse "${reference}". Try "John 3:16" or "John 3:16-18".`);
      const range = parsed.verse_end ? `${parsed.book} ${parsed.chapter}:${parsed.verse_start}-${parsed.verse_end}` : `${parsed.book} ${parsed.chapter}:${parsed.verse_start}`;
      let text = "";
      let translation = "KJV";
      try {
        const passage = await integrations.bibleApi.fetchPassage(range, bibleConfig);
        text = passage.text;
        translation = passage.translation || translation;
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Bible API error");
      }
      return api.bible.addVerseToNote(supabase, noteId, {
        book: parsed.book,
        chapter: parsed.chapter,
        verse_start: parsed.verse_start,
        verse_end: parsed.verse_end ?? null,
        translation,
        text,
      });
    },
    onSuccess: (_data, { noteId }) => {
      qc.invalidateQueries({ queryKey: noteKey(noteId) });
      qc.invalidateQueries({ queryKey: queries.keys.bible.notes });
      toast.success("Verse added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveVerse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ verseId, noteId: _noteId }: { verseId: string; noteId: string }) => {
      const { error } = await supabase.from("bible_note_verses").delete().eq("id", verseId);
      if (error) throw error;
    },
    onSuccess: (_data, { noteId }) => {
      qc.invalidateQueries({ queryKey: noteKey(noteId) });
      qc.invalidateQueries({ queryKey: queries.keys.bible.notes });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
