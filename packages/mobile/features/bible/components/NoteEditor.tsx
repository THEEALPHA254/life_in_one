import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ArrowLeft, Calendar as CalendarIcon, Plus, Trash2, X } from "lucide-react-native";
import { Field, Input } from "@/components/ui/Field";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/ui/RichTextEditor";
import { ConfirmDialog } from "@/features/tasks/components/ConfirmDialog";
import {
  useAddVerse,
  useDeleteNote,
  useNote,
  useRemoveVerse,
  useSaveNote,
  type BibleNoteWithVerses,
  type BibleVerseRow,
} from "../hooks/useBible";
import { useThemeColors } from "@/providers/ThemeProvider";

const AUTOSAVE_MS = 800;

interface Props {
  visible: boolean;
  initialNote: BibleNoteWithVerses | null;
  onClose: () => void;
}

export function NoteEditor({ visible, initialNote, onClose }: Props) {
  const colors = useThemeColors();
  const [noteId, setNoteId] = useState<string | null>(initialNote?.id ?? null);
  const [serviceTitle, setServiceTitle] = useState(initialNote?.service_title ?? "");
  const [speaker, setSpeaker] = useState(initialNote?.speaker ?? "");
  const [serviceDate, setServiceDate] = useState<Date | null>(
    initialNote?.service_date ? new Date(initialNote.service_date + "T00:00:00") : null,
  );
  const [showPicker, setShowPicker] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [verseInput, setVerseInput] = useState("");

  const noteQ = useNote(noteId);
  const save = useSaveNote();
  const del = useDeleteNote();
  const addVerse = useAddVerse();
  const removeVerse = useRemoveVerse();

  const editorRef = useRef<RichTextEditorHandle>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<unknown> | null>(null);
  const noteIdRef = useRef<string | null>(noteId);
  const titleRef = useRef(serviceTitle);
  const speakerRef = useRef(speaker);
  const dateRef = useRef(serviceDate);
  useEffect(() => { noteIdRef.current = noteId; }, [noteId]);
  useEffect(() => { titleRef.current = serviceTitle; }, [serviceTitle]);
  useEffect(() => { speakerRef.current = speaker; }, [speaker]);
  useEffect(() => { dateRef.current = serviceDate; }, [serviceDate]);

  const flushAndSave = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inflight.current) {
      try { await inflight.current; } catch { /* prior error already toasted */ }
    }
    const latest = editorRef.current
      ? await editorRef.current.readContent()
      : { contentJson: { type: "doc", content: [] }, contentText: "" };
    const p = save.mutateAsync({
      id: noteIdRef.current ?? undefined,
      service_title: titleRef.current.trim() || undefined,
      speaker: speakerRef.current.trim() || undefined,
      service_date: dateRef.current ? format(dateRef.current, "yyyy-MM-dd") : null,
      content_json: latest.contentJson,
      content_text: latest.contentText,
    });
    inflight.current = p;
    try {
      const saved = await p;
      if (!noteIdRef.current) {
        noteIdRef.current = saved.id;
        setNoteId(saved.id);
      }
      setSavedAt(new Date());
    } finally {
      if (inflight.current === p) inflight.current = null;
    }
  }, [save]);

  const schedule = useCallback(() => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flushAndSave(); }, AUTOSAVE_MS);
  }, [flushAndSave]);

  const onTextField = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    schedule();
  };

  const onDateChange = async (next: Date | null) => {
    setServiceDate(next);
    dirty.current = true;
    await flushAndSave();
  };

  const onAddVerse = async () => {
    const ref = verseInput.trim();
    if (!ref) return;
    let id = noteIdRef.current;
    if (!id) {
      dirty.current = true;
      await flushAndSave();
      id = noteIdRef.current;
    }
    if (!id) return;
    setVerseInput("");
    await addVerse.mutateAsync({ noteId: id, reference: ref });
  };

  const onBack = async () => {
    try { if (dirty.current) await flushAndSave(); }
    finally { onClose(); }
  };

  const flushRef = useRef(flushAndSave);
  useEffect(() => { flushRef.current = flushAndSave; }, [flushAndSave]);
  useEffect(() => {
    return () => {
      if (dirty.current) void flushRef.current();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const verses = noteQ.data?.verses ?? initialNote?.verses ?? [];

  const savedLabel = save.isPending
    ? "Saving…"
    : savedAt
      ? `Saved · ${format(savedAt, "HH:mm:ss")}`
      : noteId
        ? "All changes saved"
        : "Autosaves as you type";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onBack}>
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View className="flex-row items-center gap-3 border-b border-border bg-surface px-5 py-3">
            <Pressable onPress={onBack} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <ArrowLeft size={18} color={colors.foreground2} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-foreground">
                {noteId ? "Edit note" : "New note"}
              </Text>
              <Text className="text-[11px] text-muted-foreground">{savedLabel}</Text>
            </View>
            {noteId ? (
              <Pressable
                onPress={() => setConfirmDelete(true)}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.destructiveSoft }}
              >
                <Trash2 size={16} color="#ef4444" />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}
          >
            <Field label="Service title">
              <Input
                value={serviceTitle}
                onChangeText={onTextField(setServiceTitle)}
                placeholder="e.g. Sunday morning"
              />
            </Field>

            <View className="flex-row gap-3">
              <View style={{ flex: 1 }}>
                <Field label="Speaker">
                  <Input
                    value={speaker}
                    onChangeText={onTextField(setSpeaker)}
                    placeholder="Optional"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Date">
                  <Pressable
                    onPress={() => setShowPicker(true)}
                    className="h-12 flex-row items-center gap-2 rounded-xl bg-surface px-4"
                    style={{ borderWidth: 1, borderColor: colors.border }}
                  >
                    <CalendarIcon size={16} color={colors.mutedForeground} />
                    <Text style={{ color: serviceDate ? colors.foreground : colors.mutedForeground, fontSize: 14 }}>
                      {serviceDate ? format(serviceDate, "d MMM yyyy") : "Optional"}
                    </Text>
                  </Pressable>
                </Field>
              </View>
            </View>

            <View>
              <Text className="mb-1.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Verses
              </Text>
              <View className="gap-2">
                {verses.map((v) => (
                  <VerseCard
                    key={v.id}
                    verse={v}
                    onRemove={() => {
                      const id = noteIdRef.current;
                      if (!id) return;
                      void removeVerse.mutate({ verseId: v.id, noteId: id });
                    }}
                  />
                ))}
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={verseInput}
                    onChangeText={setVerseInput}
                    placeholder='e.g. "John 3:16"'
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="words"
                    autoCorrect={false}
                    style={{
                      flex: 1,
                      height: 44,
                      paddingHorizontal: 14,
                      fontSize: 14,
                      color: colors.foreground,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    onSubmitEditing={onAddVerse}
                  />
                  <Pressable
                    onPress={onAddVerse}
                    disabled={addVerse.isPending || !verseInput.trim()}
                    className="h-11 flex-row items-center justify-center gap-1 rounded-xl px-4"
                    style={{ backgroundColor: "#6366f1", opacity: addVerse.isPending || !verseInput.trim() ? 0.6 : 1 }}
                  >
                    {addVerse.isPending ? (
                      <ActivityIndicator size="small" color={colors.surface} />
                    ) : (
                      <>
                        <Plus size={14} color={colors.surface} />
                        <Text style={{ color: colors.surface, fontSize: 13, fontWeight: "600" }}>Add</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={{ minHeight: 320 }}>
              <RichTextEditor
                ref={editorRef}
                initialContent={initialNote?.content_json ?? null}
                onChange={schedule}
                placeholder="Sermon notes, reflections, questions…"
                autoFocus={false}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {showPicker ? (
          <DateTimePicker
            value={serviceDate ?? new Date()}
            mode="date"
            onChange={(evt, s) => {
              setShowPicker(false);
              if (evt.type === "set" && s) void onDateChange(s);
            }}
          />
        ) : null}

        <ConfirmDialog
          visible={confirmDelete}
          title="Delete this note?"
          description="Removes the note and its verse attachments. Cannot be undone."
          confirmLabel="Delete"
          destructive
          pending={del.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            if (!noteId) {
              setConfirmDelete(false);
              onClose();
              return;
            }
            dirty.current = false;
            if (timer.current) clearTimeout(timer.current);
            await del.mutateAsync(noteId);
            setConfirmDelete(false);
            onClose();
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

function VerseCard({ verse, onRemove }: { verse: BibleVerseRow; onRemove: () => void }) {
  const colors = useThemeColors();
  const range = verse.verse_end
    ? `${verse.book} ${verse.chapter}:${verse.verse_start}-${verse.verse_end}`
    : `${verse.book} ${verse.chapter}:${verse.verse_start}`;
  return (
    <View
      className="rounded-xl bg-surface p-3"
      style={{ borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row items-center gap-2">
        <Text style={{ flex: 1, color: colors.foreground, fontSize: 13, fontWeight: "600" }}>{range}</Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "600" }}>{verse.translation}</Text>
        <Pressable
          onPress={onRemove}
          hitSlop={6}
          className="h-7 w-7 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.destructiveSoft }}
        >
          <X size={12} color="#ef4444" />
        </Pressable>
      </View>
      {verse.text ? (
        <Text style={{ marginTop: 6, color: colors.foreground2, fontSize: 12, lineHeight: 18, fontStyle: "italic" }}>
          {verse.text}
        </Text>
      ) : null}
    </View>
  );
}
