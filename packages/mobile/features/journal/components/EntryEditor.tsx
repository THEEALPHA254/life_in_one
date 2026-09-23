import { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { ConfirmDialog } from "@/features/tasks/components/ConfirmDialog";
import { MoodPicker } from "./MoodPicker";
import { TagInput } from "./TagInput";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/ui/RichTextEditor";
import {
  useAddTagToEntry,
  useDeleteEntry,
  useEntry,
  useRemoveTagFromEntry,
  useSaveEntry,
  useTags,
  type JournalEntryWithTags,
} from "../hooks/useJournal";
import { useThemeColors } from "@/providers/ThemeProvider";

const AUTOSAVE_MS = 800;

interface Props {
  visible: boolean;
  entryDate: string;                          // yyyy-MM-dd
  initialEntry: JournalEntryWithTags | null;  // null = new draft
  onClose: () => void;
}

export function EntryEditor({ visible, entryDate, initialEntry, onClose }: Props) {
  const colors = useThemeColors();
  const [entryId, setEntryId] = useState<string | null>(initialEntry?.id ?? null);
  const [title, setTitle] = useState(initialEntry?.title ?? "");
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(initialEntry?.mood ?? null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const entryQ = useEntry(entryId);
  const tagsQ = useTags();
  const save = useSaveEntry();
  const del = useDeleteEntry();
  const addTag = useAddTagToEntry();
  const removeTag = useRemoveTagFromEntry();

  const editorRef = useRef<RichTextEditorHandle>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<unknown> | null>(null);
  const entryIdRef = useRef<string | null>(entryId);
  const titleRef = useRef(title);
  const moodRef = useRef(mood);
  useEffect(() => { entryIdRef.current = entryId; }, [entryId]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { moodRef.current = mood; }, [mood]);

  // Stable — reads state via refs, awaits any in-flight save so two rapid
  // autosaves cannot both INSERT before the first returns an id.
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
    // Read fresh content from the WebView editor (async).
    const latest = editorRef.current
      ? await editorRef.current.readContent()
      : { contentJson: { type: "doc", content: [] }, contentText: "" };
    const p = save.mutateAsync({
      id: entryIdRef.current ?? undefined,
      entry_date: entryDate,
      title: titleRef.current.trim() || undefined,
      content_json: latest.contentJson,
      content_text: latest.contentText,
      mood: moodRef.current,
    });
    inflight.current = p;
    try {
      const saved = await p;
      if (!entryIdRef.current) {
        entryIdRef.current = saved.id;
        setEntryId(saved.id);
      }
      setSavedAt(new Date());
    } finally {
      if (inflight.current === p) inflight.current = null;
    }
  }, [entryDate, save]);

  const schedule = useCallback(() => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flushAndSave(); }, AUTOSAVE_MS);
  }, [flushAndSave]);

  const onTitleChange = (value: string) => {
    setTitle(value);
    schedule();
  };

  const onMoodChange = async (next: 1 | 2 | 3 | 4 | 5 | null) => {
    setMood(next);
    dirty.current = true;
    await flushAndSave();
  };

  const onAddTag = async (name: string) => {
    let id = entryIdRef.current;
    if (!id) {
      // Persist a draft entry so we have an id to link tags against.
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
    try { if (dirty.current) await flushAndSave(); }
    finally { onClose(); }
  };

  // Best-effort save on unmount (Modal close, navigation). Ref-of-callback
  // + [] deps ensures cleanup fires ONLY on real unmount, not on every render.
  const flushRef = useRef(flushAndSave);
  useEffect(() => { flushRef.current = flushAndSave; }, [flushAndSave]);
  useEffect(() => {
    return () => {
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
                {format(new Date(entryDate + "T00:00:00"), "EEE, d MMM yyyy")}
              </Text>
              <Text className="text-[11px] text-muted-foreground">{savedLabel}</Text>
            </View>
            {entryId ? (
              <Pressable
                onPress={() => setConfirmDelete(true)}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.destructiveSoft }}
                accessibilityLabel="Delete entry"
              >
                <Trash2 size={16} color="#ef4444" />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}
          >
            <TextInput
              value={title}
              onChangeText={onTitleChange}
              placeholder="Title (optional)"
              placeholderTextColor={colors.mutedForeground}
              className="rounded-xl bg-surface px-4 py-3 text-[17px] font-medium text-foreground"
              style={{ borderWidth: 1, borderColor: colors.border }}
            />

            <View>
              <Text className="mb-1.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Mood
              </Text>
              <MoodPicker value={mood} onChange={(m) => void onMoodChange(m)} />
            </View>

            <View>
              <Text className="mb-1.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Tags
              </Text>
              <TagInput
                tags={currentTags}
                suggestions={tagsQ.data ?? []}
                onAdd={onAddTag}
                onRemove={onRemoveTag}
              />
            </View>

            <View style={{ minHeight: 320 }}>
              <RichTextEditor
                ref={editorRef}
                initialContent={initialEntry?.content_json ?? null}
                onChange={schedule}
                autoFocus
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <ConfirmDialog
          visible={confirmDelete}
          title="Delete this entry?"
          description="Removes the entry and all its tag links. Cannot be undone."
          confirmLabel="Delete"
          destructive
          pending={del.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            if (!entryId) {
              setConfirmDelete(false);
              onClose();
              return;
            }
            // Cancel any pending autosave — the record is about to disappear.
            dirty.current = false;
            if (timer.current) clearTimeout(timer.current);
            await del.mutateAsync(entryId);
            setConfirmDelete(false);
            onClose();
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
