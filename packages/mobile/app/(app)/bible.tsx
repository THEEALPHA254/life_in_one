import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { Plus, Search } from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoteEditor } from "@/features/bible/components/NoteEditor";
import { useNotes, type BibleNoteWithVerses } from "@/features/bible/hooks/useBible";
import { useThemeColors } from "@/providers/ThemeProvider";

export default function BibleScreen() {
  const colors = useThemeColors();
  const [search, setSearch] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  const [openNote, setOpenNote] = useState<BibleNoteWithVerses | null>(null);

  const notesQ = useNotes();
  const notes = notesQ.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const hay = [
        n.service_title ?? "",
        n.speaker ?? "",
        n.content_text ?? "",
        ...(n.verses ?? []).map((v) =>
          `${v.book} ${v.chapter}:${v.verse_start}${v.verse_end ? "-" + v.verse_end : ""}`,
        ),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [notes, search]);

  const openNew = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpenNote(null);
    setEditorVisible(true);
  };
  const openExisting = (note: BibleNoteWithVerses) => {
    setOpenNote(note);
    setEditorVisible(true);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScreenHeader title="Bible" subtitle="Sermon notes + verses." />

      <View className="px-5 pb-2">
        <View
          className="h-11 flex-row items-center gap-2 rounded-xl bg-surface px-3"
          style={{ borderWidth: 1, borderColor: colors.border }}
        >
          <Search size={14} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search title, speaker, content, or reference"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, fontSize: 14, color: colors.foreground }}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140, gap: 10 }}
        ListEmptyComponent={
          notesQ.isLoading ? (
            <Text className="mt-4 text-center text-sm text-muted-foreground">Loading…</Text>
          ) : (
            <View className="mt-2">
              <EmptyState
                emoji="📖"
                title="No notes yet"
                subtitle="Capture a service, sermon, or your own study."
                ctaLabel="New note"
                onCta={openNew}
              />
            </View>
          )
        }
        renderItem={({ item }) => <NoteRow note={item} onPress={() => openExisting(item)} />}
      />

      <Pressable
        onPress={openNew}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full"
        style={{
          backgroundColor: "#6366f1",
          shadowColor: "#6366f1",
          shadowOpacity: 0.45,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
        accessibilityLabel="New note"
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>

      {editorVisible ? (
        <NoteEditor
          visible={editorVisible}
          initialNote={openNote}
          onClose={() => setEditorVisible(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function NoteRow({ note, onPress }: { note: BibleNoteWithVerses; onPress: () => void }) {
  const colors = useThemeColors();
  const excerpt = (note.content_text ?? "").slice(0, 200);
  const heading = note.service_title || (excerpt.split("\n")[0] || "Untitled note");
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl bg-surface p-4"
      style={{ borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row items-center gap-2">
        <Text numberOfLines={1} style={{ flex: 1, color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
          {heading}
        </Text>
        {note.service_date ? (
          <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
            {format(new Date(note.service_date + "T00:00:00"), "d MMM yyyy")}
          </Text>
        ) : null}
      </View>
      {note.speaker ? (
        <Text style={{ marginTop: 2, color: colors.mutedForeground, fontSize: 12 }} numberOfLines={1}>
          Speaker: {note.speaker}
        </Text>
      ) : null}
      {excerpt ? (
        <Text numberOfLines={2} style={{ marginTop: 6, color: colors.mutedForeground, fontSize: 12 }}>
          {excerpt}
        </Text>
      ) : null}
      {(note.verses ?? []).length > 0 ? (
        <View className="mt-2 flex-row flex-wrap gap-1">
          {(note.verses ?? []).slice(0, 3).map((v) => (
            <View key={v.id} className="rounded-full px-2 py-0.5" style={{ backgroundColor: "#eef2ff" }}>
              <Text style={{ color: "#4338ca", fontSize: 10, fontWeight: "600" }}>
                {v.book} {v.chapter}:{v.verse_start}
                {v.verse_end ? `-${v.verse_end}` : ""}
              </Text>
            </View>
          ))}
          {(note.verses ?? []).length > 3 ? (
            <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.muted }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: "600" }}>
                +{(note.verses ?? []).length - 3}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
