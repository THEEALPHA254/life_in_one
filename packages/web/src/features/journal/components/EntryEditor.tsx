import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MoodPicker } from "./MoodPicker";
import { TagInput } from "./TagInput";
import { ManageTagsDialog } from "./ManageTagsDialog";
import {
  useAddTagToEntry,
  useDeleteEntry,
  useEntry,
  useRemoveTagFromEntry,
  useSaveEntry,
  useTags,
  type JournalEntryWithTags,
} from "../hooks/useJournal";

const AUTOSAVE_MS = 800;

interface Props {
  entryDate: string;                                  // yyyy-MM-dd
  initialEntry: JournalEntryWithTags | null;          // null = new draft
  onClose: () => void;
  onIdAssigned: (id: string) => void;                 // called after first save
}

export function EntryEditor({ entryDate, initialEntry, onClose, onIdAssigned }: Props) {
  const [entryId, setEntryId] = useState<string | null>(initialEntry?.id ?? null);
  const [title, setTitle] = useState<string>(initialEntry?.title ?? "");
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(initialEntry?.mood ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [manageTagsOpen, setManageTagsOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const entryQ = useEntry(entryId);
  const tagsQ = useTags();
  const save = useSaveEntry();
  const del = useDeleteEntry();
  const addTag = useAddTagToEntry();
  const removeTag = useRemoveTagFromEntry();

  // Latest editor content, tracked without triggering re-renders.
  const draft = useRef<{ contentJson: unknown; contentText: string }>({
    contentJson: initialEntry?.content_json ?? { type: "doc", content: [] },
    contentText: initialEntry?.content_text ?? "",
  });
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryIdRef = useRef<string | null>(entryId);
  const titleRef = useRef(title);
  const moodRef = useRef(mood);
  const inflight = useRef<Promise<unknown> | null>(null);
  const onIdAssignedRef = useRef(onIdAssigned);
  useEffect(() => { entryIdRef.current = entryId; }, [entryId]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { moodRef.current = mood; }, [mood]);
  useEffect(() => { onIdAssignedRef.current = onIdAssigned; }, [onIdAssigned]);

  // Stable — reads state through refs and awaits any in-flight save so two
  // rapid autosaves cannot both INSERT before the first returns an id.
  const flushAndSave = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inflight.current) {
      try {
        await inflight.current;
      } catch {
        // previous error already surfaced via toast
      }
    }
    const p = save.mutateAsync({
      id: entryIdRef.current ?? undefined,
      entry_date: entryDate,
      title: titleRef.current.trim() || undefined,
      content_json: draft.current.contentJson,
      content_text: draft.current.contentText,
      mood: moodRef.current,
    });
    inflight.current = p;
    try {
      const saved = await p;
      if (!entryIdRef.current) {
        entryIdRef.current = saved.id;
        setEntryId(saved.id);
        onIdAssignedRef.current(saved.id);
      }
      setSavedAt(new Date());
    } finally {
      if (inflight.current === p) inflight.current = null;
    }
  }, [entryDate, save]);

  const schedule = useCallback(() => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flushAndSave();
    }, AUTOSAVE_MS);
  }, [flushAndSave]);

  const onEditorUpdate = (contentJson: unknown, contentText: string) => {
    draft.current = { contentJson, contentText };
    schedule();
  };

  const onTitleChange = (value: string) => {
    setTitle(value);
    schedule();
  };

  const onMoodChange = async (next: 1 | 2 | 3 | 4 | 5 | null) => {
    setMood(next);
    // Persist immediately alongside current draft content
    dirty.current = true;
    await flushAndSave();
  };

  const onAddTag = async (name: string) => {
    let id = entryIdRef.current;
    if (!id) {
      // Ensure we have a persisted entry to attach tags to
      dirty.current = true;
      await flushAndSave();
      id = entryIdRef.current;
    }
    if (!id) return;
    await addTag.mutateAsync({ entryId: id, entryDate, name });
  };

  const onRemoveTag = async (tagId: string) => {
    const id = entryIdRef.current;
    if (!id) return;
    await removeTag.mutateAsync({ entryId: id, entryDate, tagId });
  };

  const onBack = async () => {
    try {
      if (dirty.current) await flushAndSave();
    } finally {
      onClose();
    }
  };

  const flushRef = useRef(flushAndSave);
  useEffect(() => { flushRef.current = flushAndSave; }, [flushAndSave]);
  useEffect(() => {
    return () => {
      // Best-effort save on unmount (e.g. navigating away or date change)
      if (dirty.current) void flushRef.current();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const currentTags = entryQ.data?.tags ?? initialEntry?.tags ?? [];

  const savedLabel = save.isPending
    ? "Saving…"
    : savedAt
      ? `Saved · ${format(savedAt, "HH:mm:ss")}`
      : entryId
        ? "All changes saved"
        : "Autosaves as you type";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} disabled={save.isPending}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <span className="text-xs text-muted-foreground">{savedLabel}</span>
        {entryId ? (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        ) : null}
      </div>

      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Title (optional)"
        className="text-lg font-medium"
      />

      <div className="flex items-center gap-3">
        <MoodPicker value={mood} onChange={(m) => void onMoodChange(m)} />
      </div>

      <div className="space-y-1.5">
        <TagInput
          tags={currentTags}
          suggestions={tagsQ.data ?? []}
          onAdd={onAddTag}
          onRemove={onRemoveTag}
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setManageTagsOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-3 w-3" />
            Manage tags
          </button>
        </div>
      </div>

      <RichTextEditor
        key={entryId ?? "draft"}
        initialContent={initialEntry?.content_json ?? null}
        onUpdate={onEditorUpdate}
        placeholder="What happened?"
        autoFocus
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this entry?"
        description="Removes the entry and all its tag links. Cannot be undone."
        confirmLabel="Delete"
        destructive
        pending={del.isPending}
        onConfirm={async () => {
          if (!entryId) {
            setConfirmDelete(false);
            onClose();
            return;
          }
          await del.mutateAsync(entryId);
          setConfirmDelete(false);
          onClose();
        }}
      />

      <ManageTagsDialog open={manageTagsOpen} onOpenChange={setManageTagsOpen} />
    </div>
  );
}
