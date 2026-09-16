import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AddVerseInline } from "./AddVerseInline";
import { VerseCard } from "./VerseCard";
import {
  useAddVerse,
  useDeleteNote,
  useNote,
  useRemoveVerse,
  useSaveNote,
  type BibleNoteWithVerses,
} from "../hooks/useBible";

const AUTOSAVE_MS = 800;

interface Props {
  initialNote: BibleNoteWithVerses | null;
  onClose: () => void;
  onIdAssigned: (id: string) => void;
}

export function NoteEditor({ initialNote, onClose, onIdAssigned }: Props) {
  const [noteId, setNoteId] = useState<string | null>(initialNote?.id ?? null);
  const [title, setTitle] = useState<string>(initialNote?.service_title ?? "");
  const [speaker, setSpeaker] = useState<string>(initialNote?.speaker ?? "");
  const [serviceDate, setServiceDate] = useState<string | null>(initialNote?.service_date ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const noteQ = useNote(noteId);
  const save = useSaveNote();
  const del = useDeleteNote();
  const addVerse = useAddVerse();
  const removeVerse = useRemoveVerse();

  const draft = useRef<{ contentJson: unknown; contentText: string }>({
    contentJson: initialNote?.content_json ?? { type: "doc", content: [] },
    contentText: initialNote?.content_text ?? "",
  });
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef<string | null>(noteId);
  const titleRef = useRef(title);
  const speakerRef = useRef(speaker);
  const serviceDateRef = useRef(serviceDate);
  const inflight = useRef<Promise<unknown> | null>(null);
  const onIdAssignedRef = useRef(onIdAssigned);
  useEffect(() => { noteIdRef.current = noteId; }, [noteId]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { speakerRef.current = speaker; }, [speaker]);
  useEffect(() => { serviceDateRef.current = serviceDate; }, [serviceDate]);
  useEffect(() => { onIdAssignedRef.current = onIdAssigned; }, [onIdAssigned]);

  // Stable — reads all state through refs and awaits any in-flight save so
  // two rapid autosaves cannot both INSERT before the first returns an id.
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
      id: noteIdRef.current ?? undefined,
      service_date: serviceDateRef.current ?? null,
      service_title: titleRef.current.trim() || undefined,
      speaker: speakerRef.current.trim() || undefined,
      content_json: draft.current.contentJson,
      content_text: draft.current.contentText,
    });
    inflight.current = p;
    try {
      const saved = await p;
      if (!noteIdRef.current) {
        noteIdRef.current = saved.id;
        setNoteId(saved.id);
        onIdAssignedRef.current(saved.id);
      }
      setSavedAt(new Date());
    } finally {
      if (inflight.current === p) inflight.current = null;
    }
  }, [save]);

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

  const onTitleChange = (v: string) => { setTitle(v); schedule(); };
  const onSpeakerChange = (v: string) => { setSpeaker(v); schedule(); };
  const onDateChange = (d: Date | null) => {
    setServiceDate(d ? format(d, "yyyy-MM-dd") : null);
    dirty.current = true;
    void flushAndSave();
  };

  const onAddVerse = async (reference: string) => {
    let id = noteIdRef.current;
    if (!id) {
      dirty.current = true;
      await flushAndSave();
      id = noteIdRef.current;
    }
    if (!id) return;
    await addVerse.mutateAsync({ noteId: id, reference });
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
      if (dirty.current) void flushRef.current();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const currentVerses = noteQ.data?.verses ?? initialNote?.verses ?? [];

  const savedLabel = save.isPending
    ? "Saving…"
    : savedAt
      ? `Saved · ${format(savedAt, "HH:mm:ss")}`
      : noteId
        ? "All changes saved"
        : "Autosaves as you type";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack} disabled={save.isPending}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <span className="text-xs text-muted-foreground">{savedLabel}</span>
        {noteId ? (
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:gap-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">Service / topic</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Sunday service"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="speaker">Speaker</Label>
          <Input
            id="speaker"
            value={speaker}
            onChange={(e) => onSpeakerChange(e.target.value)}
            placeholder="Pastor…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="service_date">Date</Label>
          <DatePicker
            id="service_date"
            value={serviceDate ? new Date(serviceDate + "T00:00:00") : null}
            onChange={onDateChange}
          />
        </div>
      </div>

      <RichTextEditor
        key={noteId ?? "draft"}
        initialContent={initialNote?.content_json ?? null}
        onUpdate={onEditorUpdate}
        placeholder="Notes from the service…"
        autoFocus
      />

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Verses</h3>
          <span className="text-xs text-muted-foreground">{currentVerses.length}</span>
        </div>
        <AddVerseInline onAdd={onAddVerse} pending={addVerse.isPending} />
        {currentVerses.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
            No verses attached yet.
          </p>
        ) : (
          <div className="space-y-2">
            {currentVerses.map((v) => (
              <VerseCard
                key={v.id}
                verse={v}
                onRemove={(verse) => {
                  const id = noteIdRef.current;
                  if (!id) return;
                  removeVerse.mutate({ verseId: verse.id, noteId: id });
                }}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this note?"
        description="Removes the note and all attached verses. Cannot be undone."
        confirmLabel="Delete"
        destructive
        pending={del.isPending}
        onConfirm={async () => {
          if (!noteId) {
            setConfirmDelete(false);
            onClose();
            return;
          }
          await del.mutateAsync(noteId);
          setConfirmDelete(false);
          onClose();
        }}
      />
    </div>
  );
}
