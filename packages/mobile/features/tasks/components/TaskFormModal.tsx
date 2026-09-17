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
import type { TaskCreateInput } from "@lio/core/schemas/tasks";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { TaskCategoryRow, TaskRow } from "../hooks/useTasks";

interface Props {
  visible: boolean;
  editing: TaskRow | null;
  categories: TaskCategoryRow[];
  onClose: () => void;
  onSubmit: (values: TaskCreateInput) => Promise<void> | void;
  submitting?: boolean;
}

const priorities: { value: 1 | 2 | 3 | 4; label: string; color: string }[] = [
  { value: 1, label: "Urgent",  color: "#ef4444" },
  { value: 2, label: "Normal",  color: "#6366f1" },
  { value: 3, label: "Low",     color: "#94a3b8" },
  { value: 4, label: "Someday", color: "#94a3b8" },
];

export function TaskFormModal({ visible, editing, categories, onClose, onSubmit, submitting }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<1 | 2 | 3 | 4>(2);
  const [dueAt, setDueAt] = useState<Date | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState<null | "date" | "time">(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setPriority(editing?.priority ?? 2);
    setDueAt(editing?.due_at ? new Date(editing.due_at) : null);
    setCategoryId(editing?.category_id ?? null);
    setTitleError(null);
    setShowPicker(null);
  }, [visible, editing]);

  const submit = async () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_at: dueAt ? dueAt.toISOString() : null,
      category_id: categoryId,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "#f7f8fa" }}
      >
        <View className="flex-row items-center gap-3 border-b border-border bg-surface px-5 py-4">
          <Pressable onPress={onClose} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full bg-muted">
            <X size={18} color="#334155" />
          </Pressable>
          <Text className="flex-1 text-[17px] font-semibold text-foreground">
            {editing ? "Edit task" : "New task"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 120 }}>
          <Field label="Title" error={titleError ?? undefined}>
            <Input
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                if (titleError) setTitleError(null);
              }}
              autoFocus
              placeholder="What needs doing?"
            />
          </Field>

          <Field label="Description">
            <Input
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Any details…"
              style={{ height: 96, textAlignVertical: "top", paddingTop: 12 }}
            />
          </Field>

          <Field label="Priority">
            <View className="flex-row gap-2">
              {priorities.map((p) => {
                const active = priority === p.value;
                return (
                  <Pressable
                    key={p.value}
                    onPress={() => setPriority(p.value)}
                    className="flex-1 items-center rounded-xl border py-2.5"
                    style={{
                      borderColor: active ? p.color : "#e2e8f0",
                      backgroundColor: active ? p.color + "15" : "#ffffff",
                    }}
                  >
                    <Text
                      style={{
                        color: active ? p.color : "#64748b",
                        fontSize: 13,
                        fontWeight: active ? "600" : "500",
                      }}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Due">
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setShowPicker("date")}
                className="h-12 flex-1 flex-row items-center gap-2 rounded-xl bg-surface px-4"
                style={{ borderWidth: 1, borderColor: "#e2e8f0" }}
              >
                <CalendarIcon size={16} color="#64748b" />
                <Text style={{ color: dueAt ? "#0f172a" : "#94a3b8", fontSize: 15 }}>
                  {dueAt ? format(dueAt, "EEE, d MMM · HH:mm") : "Pick a date & time"}
                </Text>
              </Pressable>
              {dueAt ? (
                <Pressable
                  onPress={() => setDueAt(null)}
                  className="h-12 items-center justify-center rounded-xl bg-muted px-4"
                >
                  <Text style={{ color: "#64748b", fontSize: 13, fontWeight: "600" }}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
          </Field>

          <Field label="Category">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
              <Pressable
                onPress={() => setCategoryId(null)}
                className="rounded-full px-3.5 py-2"
                style={{
                  borderWidth: 1,
                  borderColor: categoryId === null ? "#6366f1" : "#e2e8f0",
                  backgroundColor: categoryId === null ? "#eef2ff" : "#ffffff",
                }}
              >
                <Text style={{ color: categoryId === null ? "#4338ca" : "#64748b", fontSize: 13, fontWeight: "500" }}>
                  No category
                </Text>
              </Pressable>
              {categories.map((c) => {
                const active = categoryId === c.id;
                const colour = c.color ?? "#6366f1";
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategoryId(c.id)}
                    className="rounded-full px-3.5 py-2"
                    style={{
                      borderWidth: 1,
                      borderColor: active ? colour : "#e2e8f0",
                      backgroundColor: active ? colour + "18" : "#ffffff",
                    }}
                  >
                    <Text style={{ color: active ? colour : "#64748b", fontSize: 13, fontWeight: "500" }}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {categories.length === 0 ? (
              <Text className="text-xs text-muted-foreground">
                No categories yet — create them on the web app.
              </Text>
            ) : null}
          </Field>
        </ScrollView>

        <View className="border-t border-border bg-surface px-5 py-3">
          <PrimaryButton
            label={submitting ? "Saving…" : editing ? "Save changes" : "Add task"}
            loading={submitting}
            onPress={submit}
          />
        </View>

        {showPicker === "date" ? (
          <DateTimePicker
            value={dueAt ?? new Date()}
            mode="date"
            onChange={(evt, selected) => {
              setShowPicker(null);
              if (evt.type === "set" && selected) {
                const merged = new Date(selected);
                if (dueAt) merged.setHours(dueAt.getHours(), dueAt.getMinutes(), 0, 0);
                else merged.setHours(9, 0, 0, 0);
                setDueAt(merged);
                setTimeout(() => setShowPicker("time"), 250);
              }
            }}
          />
        ) : null}
        {showPicker === "time" ? (
          <DateTimePicker
            value={dueAt ?? new Date()}
            mode="time"
            is24Hour
            onChange={(evt, selected) => {
              setShowPicker(null);
              if (evt.type === "set" && selected) {
                const merged = new Date(dueAt ?? selected);
                merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                setDueAt(merged);
              }
            }}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
