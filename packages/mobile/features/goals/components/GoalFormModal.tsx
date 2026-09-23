import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react-native";
import type { GoalInput } from "@lio/core/schemas/goals";
import type { GoalStatus } from "@lio/core/types";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { GoalRow } from "../hooks/useGoals";
import { useThemeColors } from "@/providers/ThemeProvider";

interface Props {
  visible: boolean;
  editing: GoalRow | null;
  defaultYear: number;
  onClose: () => void;
  onSubmit: (values: GoalInput) => Promise<void> | void;
  submitting?: boolean;
}

const STATUS_OPTIONS: { value: GoalStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "#94a3b8" },
  { value: "in_progress", label: "In progress", color: "#6366f1" },
  { value: "achieved", label: "Achieved", color: "#10b981" },
  { value: "abandoned", label: "Abandoned", color: "#f59e0b" },
];

export function GoalFormModal({ visible, editing, defaultYear, onClose, onSubmit, submitting }: Props) {
  const colors = useThemeColors();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(defaultYear);
  const [status, setStatus] = useState<GoalStatus>("pending");
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description ?? "");
      setYear(editing.year);
      setStatus(editing.status);
      setTargetDate(editing.target_date ? new Date(editing.target_date + "T00:00:00") : null);
    } else {
      setTitle("");
      setDescription("");
      setYear(defaultYear);
      setStatus("pending");
      setTargetDate(null);
    }
    setTitleError(null);
    setShowPicker(false);
  }, [visible, editing, defaultYear]);

  const submit = async () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      year,
      status,
      target_date: targetDate ? format(targetDate, "yyyy-MM-dd") : null,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View className="flex-row items-center gap-3 border-b border-border bg-surface px-5 py-4">
          <Pressable onPress={onClose} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full bg-muted">
            <X size={18} color={colors.foreground2} />
          </Pressable>
          <Text className="flex-1 text-[17px] font-semibold text-foreground">
            {editing ? "Edit goal" : "New goal"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }}>
          <Field label="Title" error={titleError ?? undefined}>
            <Input
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                if (titleError) setTitleError(null);
              }}
              autoFocus
              placeholder="What do you want to achieve?"
            />
          </Field>

          <Field label="Description">
            <Input
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Why does this matter?"
              style={{ height: 96, textAlignVertical: "top", paddingTop: 12 }}
            />
          </Field>

          <View className="flex-row gap-3">
            <View style={{ flex: 1 }}>
              <Field label="Year">
                <Input
                  value={String(year)}
                  onChangeText={(v) => {
                    const n = Number(v);
                    if (Number.isFinite(n) && n >= 2000 && n <= 2100) setYear(n);
                  }}
                  keyboardType="number-pad"
                />
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Target date">
                <Pressable
                  onPress={() => setShowPicker(true)}
                  className="h-12 flex-row items-center gap-2 rounded-xl bg-surface px-4"
                  style={{ borderWidth: 1, borderColor: colors.border }}
                >
                  <CalendarIcon size={16} color={colors.mutedForeground} />
                  <Text style={{ color: targetDate ? colors.foreground : colors.mutedForeground, fontSize: 14 }}>
                    {targetDate ? format(targetDate, "d MMM yyyy") : "Optional"}
                  </Text>
                </Pressable>
              </Field>
            </View>
          </View>

          <Field label="Status">
            <View className="flex-row flex-wrap gap-2">
              {STATUS_OPTIONS.map((o) => {
                const active = status === o.value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => setStatus(o.value)}
                    className="rounded-full px-3.5 py-2"
                    style={{
                      borderWidth: 1,
                      borderColor: active ? o.color : colors.border,
                      backgroundColor: active ? o.color + "18" : colors.surface,
                    }}
                  >
                    <Text style={{ color: active ? o.color : colors.mutedForeground, fontSize: 13, fontWeight: active ? "600" : "500" }}>
                      {o.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        </ScrollView>

        <View className="border-t border-border bg-surface px-5 py-3">
          <PrimaryButton
            label={submitting ? "Saving…" : editing ? "Save changes" : "Add goal"}
            loading={submitting}
            onPress={submit}
          />
        </View>

        {showPicker ? (
          <DateTimePicker
            value={targetDate ?? new Date(year, 11, 31)}
            mode="date"
            onChange={(evt, s) => {
              setShowPicker(false);
              if (evt.type === "set" && s) setTargetDate(s);
            }}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
