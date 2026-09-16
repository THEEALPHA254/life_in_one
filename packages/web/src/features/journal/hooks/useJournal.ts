import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, queries } from "@lio/core";
import type { JournalEntryInput } from "@lio/core/schemas/journal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";

export interface JournalTagRow {
  id: string;
  user_id: string;
  name: string;
}

export interface JournalEntryRow {
  id: string;
  user_id: string;
  entry_date: string;
  title: string | null;
  content_json: unknown;
  content_text: string | null;
  mood: 1 | 2 | 3 | 4 | 5 | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryWithTags extends JournalEntryRow {
  tags: JournalTagRow[];
}

const dayKey = (date: string) => ["journal", "day", date] as const;
const entryKey = (id: string) => ["journal", "entry", id] as const;
const tagsKey = ["journal", "tags", "all"] as const;

export function useEntriesByDate(entryDate: string) {
  return useQuery({
    queryKey: dayKey(entryDate),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*, tags:journal_tags(id, user_id, name)")
        .eq("entry_date", entryDate)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as JournalEntryWithTags[];
    },
  });
}

export function useEntry(id: string | null) {
  return useQuery({
    queryKey: id ? entryKey(id) : ["journal", "entry", "none"],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*, tags:journal_tags(id, user_id, name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as JournalEntryWithTags;
    },
  });
}

export function useEntries(search: string) {
  return useQuery({
    queryKey: queries.keys.journal.list(search || undefined),
    queryFn: async () =>
      (await api.journal.listEntries(supabase, { limit: 50, search: search || undefined })) as JournalEntryRow[],
  });
}

export function useTags() {
  return useQuery({
    queryKey: tagsKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("journal_tags").select("*").order("name");
      if (error) throw error;
      return data as JournalTagRow[];
    },
  });
}

// Content autosave — updates caches in place. Never invalidates the day-list
// or the entry query (would refetch and race with in-flight typing). Only
// invalidates the cross-date recent list so excerpts refresh there.
export function useSaveEntry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: JournalEntryInput & { id?: string }) => {
      if (!user) throw new Error("Not authenticated");
      return (await api.journal.upsertEntry(supabase, { ...input, user_id: user.id })) as JournalEntryRow;
    },
    onSuccess: (row, vars) => {
      qc.setQueryData<JournalEntryWithTags[]>(dayKey(vars.entry_date), (prev = []) => {
        const idx = prev.findIndex((e) => e.id === row.id);
        const existingTags = idx >= 0 ? prev[idx]!.tags : [];
        const merged: JournalEntryWithTags = { ...(row as JournalEntryRow), tags: existingTags };
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = merged;
          return next;
        }
        return [...prev, merged];
      });
      qc.setQueryData<JournalEntryWithTags | null>(entryKey(row.id), (prev) => ({
        ...(row as JournalEntryRow),
        tags: prev?.tags ?? [],
      }));
      qc.invalidateQueries({ queryKey: queries.keys.journal.list() });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.journal.deleteEntry(supabase, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
      toast.success("Entry deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from("journal_tags").delete().eq("id", tagId);
      if (error) throw error;
      return tagId;
    },
    onSuccess: () => {
      // Tag removal cascades to journal_entry_tags — invalidate everything journal-related.
      qc.invalidateQueries({ queryKey: ["journal"] });
      toast.success("Tag deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddTagToEntry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ entryId, entryDate, name }: { entryId: string; entryDate: string; name: string }) => {
      if (!user) throw new Error("Not authenticated");
      const trimmed = name.trim().toLowerCase();
      if (!trimmed) throw new Error("Empty tag");
      const { data: existing } = await supabase
        .from("journal_tags")
        .select("*")
        .eq("user_id", user.id)
        .eq("name", trimmed)
        .maybeSingle();
      let tag = existing as JournalTagRow | null;
      if (!tag) {
        const { data, error } = await supabase
          .from("journal_tags")
          .insert({ user_id: user.id, name: trimmed })
          .select()
          .single();
        if (error) throw error;
        tag = data as JournalTagRow;
      }
      const { error: linkError } = await supabase
        .from("journal_entry_tags")
        .insert({ entry_id: entryId, tag_id: tag.id });
      if (linkError && linkError.code !== "23505") throw linkError;
      return { entryId, entryDate, tag };
    },
    onSuccess: ({ entryDate, entryId }) => {
      qc.invalidateQueries({ queryKey: dayKey(entryDate) });
      qc.invalidateQueries({ queryKey: entryKey(entryId) });
      qc.invalidateQueries({ queryKey: tagsKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveTagFromEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, entryDate, tagId }: { entryId: string; entryDate: string; tagId: string }) => {
      const { error } = await supabase
        .from("journal_entry_tags")
        .delete()
        .eq("entry_id", entryId)
        .eq("tag_id", tagId);
      if (error) throw error;
      return { entryDate, entryId };
    },
    onSuccess: ({ entryDate, entryId }) => {
      qc.invalidateQueries({ queryKey: dayKey(entryDate) });
      qc.invalidateQueries({ queryKey: entryKey(entryId) });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
