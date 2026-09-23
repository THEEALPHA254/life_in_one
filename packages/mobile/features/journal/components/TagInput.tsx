import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Plus, X } from "lucide-react-native";
import type { JournalTagRow } from "../hooks/useJournal";
import { useThemeColors } from "@/providers/ThemeProvider";

interface Props {
  tags: JournalTagRow[];
  suggestions: JournalTagRow[];
  onAdd: (name: string) => void | Promise<void>;
  onRemove: (tagId: string) => void | Promise<void>;
  disabled?: boolean;
}

export function TagInput({ tags, suggestions, onAdd, onRemove, disabled }: Props) {
  const colors = useThemeColors();
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const trimmed = draft.trim().toLowerCase();
  const existingIds = useMemo(() => new Set(tags.map((t) => t.id)), [tags]);
  const currentNames = useMemo(() => new Set(tags.map((t) => t.name.toLowerCase())), [tags]);

  const filteredSuggestions = useMemo(
    () =>
      suggestions
        .filter((s) => !existingIds.has(s.id))
        .filter((s) => (trimmed ? s.name.toLowerCase().includes(trimmed) : true))
        .slice(0, 6),
    [suggestions, existingIds, trimmed],
  );

  const canCreateNew =
    trimmed.length > 0 &&
    !currentNames.has(trimmed) &&
    !suggestions.some((s) => s.name.toLowerCase() === trimmed);

  const commit = (raw: string) => {
    const name = raw.trim().toLowerCase();
    if (!name) return;
    setDraft("");
    if (currentNames.has(name)) return;
    void onAdd(name);
    // keep focus so user can add another
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const showDropdown = focused && (filteredSuggestions.length > 0 || canCreateNew);

  return (
    <View className="gap-2">
      <View
        className="flex-row flex-wrap items-center gap-1.5 rounded-xl bg-surface p-2"
        style={{ borderWidth: 1, borderColor: focused ? "#6366f1" : colors.border }}
      >
        {tags.map((t) => (
          <View
            key={t.id}
            className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
            style={{ backgroundColor: "#eef2ff" }}
          >
            <Text style={{ color: "#4338ca", fontSize: 12, fontWeight: "500" }}>{t.name}</Text>
            <Pressable
              onPress={() => onRemove(t.id)}
              hitSlop={6}
              disabled={disabled}
              accessibilityLabel={`Remove ${t.name}`}
            >
              <X size={12} color="#4338ca" />
            </Pressable>
          </View>
        ))}
        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => commit(draft)}
          onFocus={() => setFocused(true)}
          // Blur runs before dropdown press — delay so the tap registers.
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={tags.length === 0 ? "Add tags…" : "Add tag…"}
          placeholderTextColor={colors.mutedForeground}
          editable={!disabled}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          style={{ flexGrow: 1, minWidth: 100, fontSize: 14, paddingHorizontal: 6, paddingVertical: 4, color: colors.foreground }}
        />
      </View>

      {showDropdown ? (
        <View
          className="rounded-xl bg-surface"
          style={{ borderWidth: 1, borderColor: colors.border }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 180 }}
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            {filteredSuggestions.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => commit(s.name)}
                className="px-3 py-2.5"
                android_ripple={{ color: "#eef2ff" }}
              >
                <Text style={{ color: colors.foreground, fontSize: 14 }}>{s.name}</Text>
              </Pressable>
            ))}
            {canCreateNew ? (
              <Pressable
                onPress={() => commit(draft)}
                className="flex-row items-center gap-2 px-3 py-2.5"
                android_ripple={{ color: "#eef2ff" }}
              >
                <Plus size={14} color="#6366f1" />
                <Text style={{ color: "#4338ca", fontSize: 14 }}>
                  Create tag <Text style={{ fontWeight: "600" }}>"{trimmed}"</Text>
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
