import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addDays, format, isSameDay } from "date-fns";
import * as Haptics from "expo-haptics";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react-native";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntryEditor } from "@/features/journal/components/EntryEditor";
import {
  useEntries,
  useEntriesByDate,
  type JournalEntryWithTags,
} from "@/features/journal/hooks/useJournal";
import { useThemeColors } from "@/providers/ThemeProvider";

const isoDate = (d: Date) => format(d, "yyyy-MM-dd");
const moodEmoji: Record<number, string> = { 1: "😞", 2: "😐", 3: "🙂", 4: "😊", 5: "🤩" };

type Open = null | { kind: "new" } | { kind: "existing"; entry: JournalEntryWithTags };

export default function JournalScreen() {
  const colors = useThemeColors();
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [search, setSearch] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [open, setOpen] = useState<Open>(null);

  const dateKey = isoDate(cursor);
  const dayEntriesQ = useEntriesByDate(dateKey);
  const entriesQ = useEntries(search);

  const dayEntries = dayEntriesQ.data ?? [];
  const crossDay = entriesQ.data ?? [];

  const isToday = isSameDay(cursor, new Date());

  const openNew = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpen({ kind: "new" });
  };

  const openEntry = (entry: JournalEntryWithTags) => {
    if (!isSameDay(new Date(entry.entry_date + "T00:00:00"), cursor)) {
      setCursor(new Date(entry.entry_date + "T00:00:00"));
    }
    setOpen({ kind: "existing", entry });
  };

  const initialForEditor = useMemo(() => {
    if (open?.kind !== "existing") return null;
    // Prefer the freshest row from the day-list cache (kept in sync by
    // useSaveEntry's setQueryData); fall back to the row we captured on open.
    return dayEntries.find((e) => e.id === open.entry.id) ?? open.entry;
  }, [open, dayEntries]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScreenHeader title="Journal" subtitle="Track how the day went, one entry at a time." />

      <View className="px-5 pb-2">
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={() => setCursor(addDays(cursor, -1))}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            style={{ borderWidth: 1, borderColor: colors.border }}
            accessibilityLabel="Previous day"
          >
            <ChevronLeft size={16} color={colors.foreground2} />
          </Pressable>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-surface px-3"
            style={{ borderWidth: 1, borderColor: colors.border }}
          >
            <CalendarDays size={14} color={colors.foreground2} />
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "500" }}>
              {format(cursor, "EEE, d MMM yyyy")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setCursor(addDays(cursor, 1))}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            style={{ borderWidth: 1, borderColor: colors.border }}
            accessibilityLabel="Next day"
          >
            <ChevronRight size={16} color={colors.foreground2} />
          </Pressable>
          <Pressable
            onPress={() => setCursor(new Date())}
            disabled={isToday}
            className="h-10 items-center justify-center rounded-full px-4"
            style={{ backgroundColor: isToday ? colors.border : "#eef2ff" }}
          >
            <Text style={{ color: isToday ? colors.mutedForeground : "#4338ca", fontSize: 13, fontWeight: "600" }}>
              Today
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={dayEntries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140 }}
        ItemSeparatorComponent={ItemGap}
        ListHeaderComponent={
          <View className="mb-3 flex-row items-center gap-2">
            <Text className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
              Entries
            </Text>
            {dayEntries.length > 0 ? (
              <Text className="text-[12px] font-medium text-muted-foreground">· {dayEntries.length}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          dayEntriesQ.isLoading ? (
            <Text className="mt-4 text-center text-sm text-muted-foreground">Loading…</Text>
          ) : (
            <View className="mt-2">
              <EmptyState
                emoji="📓"
                title="Nothing written yet"
                subtitle="Capture a thought, a feeling, or what happened today."
                ctaLabel="Start an entry"
                onCta={openNew}
              />
            </View>
          )
        }
        renderItem={({ item }) => <EntryRow entry={item} onPress={() => openEntry(item)} />}
        ListFooterComponent={
          <View className="mt-8 gap-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-[15px] font-semibold text-foreground">Across all days</Text>
            </View>
            <View
              className="h-11 flex-row items-center gap-2 rounded-xl bg-surface px-3"
              style={{ borderWidth: 1, borderColor: colors.border }}
            >
              <Search size={14} color={colors.mutedForeground} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search entries…"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                style={{ flex: 1, fontSize: 14, color: colors.foreground }}
              />
            </View>
            {entriesQ.isLoading ? (
              <Text className="mt-2 text-center text-xs text-muted-foreground">Loading…</Text>
            ) : crossDay.length === 0 ? (
              <Text
                className="rounded-xl px-4 py-6 text-center text-xs text-muted-foreground"
                style={{ borderWidth: 1, borderColor: colors.border, borderStyle: "dashed" }}
              >
                {search ? "No entries match." : "No entries yet."}
              </Text>
            ) : (
              <View className="rounded-xl bg-surface" style={{ borderWidth: 1, borderColor: colors.border }}>
                {crossDay.map((e, i) => {
                  const excerpt = (e.content_text ?? "").slice(0, 140);
                  return (
                    <Pressable
                      key={e.id}
                      onPress={() => {
                        setCursor(new Date(e.entry_date + "T00:00:00"));
                        setOpen({ kind: "existing", entry: { ...e, tags: [] } });
                      }}
                      className="px-4 py-3"
                      style={{ borderTopWidth: i === 0 ? 0 : 1, borderColor: colors.muted }}
                    >
                      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "500" }}>
                        {format(new Date(e.entry_date + "T00:00:00"), "EEE, d MMM yyyy")}
                        {e.title ? <Text style={{ color: colors.mutedForeground }}> · {e.title}</Text> : null}
                      </Text>
                      {excerpt ? (
                        <Text
                          numberOfLines={2}
                          style={{ marginTop: 2, color: colors.mutedForeground, fontSize: 12 }}
                        >
                          {excerpt}
                        </Text>
                      ) : (
                        <Text style={{ marginTop: 2, color: colors.mutedForeground, fontSize: 12, fontStyle: "italic" }}>
                          Empty entry
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        }
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
        accessibilityLabel="New entry"
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>

      {showDatePicker ? (
        <DateTimePicker
          value={cursor}
          mode="date"
          onChange={(evt, selected) => {
            setShowDatePicker(false);
            if (evt.type === "set" && selected) setCursor(selected);
          }}
        />
      ) : null}

      {open ? (
        <EntryEditor
          visible={!!open}
          entryDate={dateKey}
          initialEntry={open.kind === "existing" ? initialForEditor : null}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function EntryRow({ entry, onPress }: { entry: JournalEntryWithTags; onPress: () => void }) {
  const colors = useThemeColors();
  const excerpt = (entry.content_text ?? "").slice(0, 200);
  const heading = entry.title || (excerpt ? excerpt.split("\n")[0] : "Untitled entry");
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl bg-surface p-4"
      style={{ borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row items-center gap-2">
        {entry.mood ? <Text style={{ fontSize: 16 }}>{moodEmoji[entry.mood]}</Text> : null}
        <Text
          numberOfLines={1}
          style={{ flex: 1, color: colors.foreground, fontSize: 14, fontWeight: "600" }}
        >
          {heading}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{format(new Date(entry.updated_at), "HH:mm")}</Text>
      </View>
      {excerpt ? (
        <Text numberOfLines={2} style={{ marginTop: 6, color: colors.mutedForeground, fontSize: 12 }}>
          {excerpt}
        </Text>
      ) : (
        <Text style={{ marginTop: 6, color: colors.mutedForeground, fontSize: 12, fontStyle: "italic" }}>
          Empty entry
        </Text>
      )}
      {entry.tags.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ marginTop: 8, gap: 6 }}
        >
          {entry.tags.map((t) => (
            <View
              key={t.id}
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: "#eef2ff" }}
            >
              <Text style={{ color: "#4338ca", fontSize: 11, fontWeight: "500" }}>{t.name}</Text>
            </View>
          ))}
        </ScrollView>
      ) : null}
    </Pressable>
  );
}

function ItemGap() {
  return <View style={{ height: 10 }} />;
}
