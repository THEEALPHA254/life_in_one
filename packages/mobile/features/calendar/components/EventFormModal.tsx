import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addHours, format } from "date-fns";
import { Calendar as CalendarIcon, Trash2, X } from "lucide-react-native";
import type { CalendarEventInput } from "@lio/core/schemas/calendar";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { CalendarEventRow } from "../hooks/useCalendarEvents";
import { useThemeColors } from "@/providers/ThemeProvider";

// All-day storage convention: noon UTC on the target local date. Prevents
// day-shift under timezone conversion (start-of-day in KE+3 becomes 21:00 UTC
// the previous day and displays on the wrong date).
function localDateToNoonUtcIso(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)).toISOString();
}

interface Props {
  visible: boolean;
  editing: CalendarEventRow | null;
  initialStart?: Date | null;
  onClose: () => void;
  onSubmit: (values: CalendarEventInput) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  submitting?: boolean;
}

type PickerKind = null | "start-date" | "start-time" | "end-date" | "end-time";

export function EventFormModal({
  visible,
  editing,
  initialStart,
  onClose,
  onSubmit,
  onDelete,
  submitting,
}: Props) {
  const colors = useThemeColors();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState<Date>(new Date());
  const [endsAt, setEndsAt] = useState<Date>(addHours(new Date(), 1));
  const [allDay, setAllDay] = useState(false);
  const [picker, setPicker] = useState<PickerKind>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description ?? "");
      setLocation(editing.location ?? "");
      setStartsAt(new Date(editing.starts_at));
      setEndsAt(new Date(editing.ends_at));
      setAllDay(editing.all_day);
    } else {
      const start = initialStart ?? new Date();
      setTitle("");
      setDescription("");
      setLocation("");
      setStartsAt(start);
      setEndsAt(addHours(start, 1));
      setAllDay(false);
    }
    setTitleError(null);
    setRangeError(null);
    setPicker(null);
  }, [visible, editing, initialStart]);

  const onToggleAllDay = (next: boolean) => {
    setAllDay(next);
    if (next) {
      setStartsAt(new Date(localDateToNoonUtcIso(startsAt)));
      setEndsAt(new Date(localDateToNoonUtcIso(endsAt)));
    }
  };

  const submit = async () => {
    setTitleError(null);
    setRangeError(null);
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    if (endsAt < startsAt) {
      setRangeError("End time must be on or after start time.");
      return;
    }
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      all_day: allDay,
    });
  };

  const onPickerChange = (kind: PickerKind, event: { type: string }, selected: Date | undefined) => {
    setPicker(null);
    if (event.type !== "set" || !selected) return;
    if (kind === "start-date") {
      const merged = new Date(startsAt);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setStartsAt(merged);
      if (!allDay) setTimeout(() => setPicker("start-time"), 250);
    } else if (kind === "start-time") {
      const merged = new Date(startsAt);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setStartsAt(merged);
    } else if (kind === "end-date") {
      const merged = new Date(endsAt);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setEndsAt(merged);
      if (!allDay) setTimeout(() => setPicker("end-time"), 250);
    } else if (kind === "end-time") {
      const merged = new Date(endsAt);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setEndsAt(merged);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View className="flex-row items-center gap-3 border-b border-border bg-surface px-5 py-4">
          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-muted"
          >
            <X size={18} color={colors.foreground2} />
          </Pressable>
          <Text className="flex-1 text-[17px] font-semibold text-foreground">
            {editing ? "Edit event" : "New event"}
          </Text>
          {editing && onDelete ? (
            <Pressable
              onPress={() => void onDelete()}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.destructiveSoft }}
              accessibilityLabel="Delete event"
            >
              <Trash2 size={16} color="#ef4444" />
            </Pressable>
          ) : null}
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
              placeholder="Give this event a name"
            />
          </Field>

          <View className="flex-row items-center justify-between rounded-xl bg-surface px-4 py-3" style={{ borderWidth: 1, borderColor: colors.border }}>
            <Text className="text-[15px] text-foreground">All day</Text>
            <Switch value={allDay} onValueChange={onToggleAllDay} />
          </View>

          <Field label="Starts">
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setPicker("start-date")}
                className="h-12 flex-1 flex-row items-center gap-2 rounded-xl bg-surface px-4"
                style={{ borderWidth: 1, borderColor: colors.border }}
              >
                <CalendarIcon size={16} color={colors.mutedForeground} />
                <Text style={{ color: colors.foreground, fontSize: 15 }}>
                  {format(startsAt, allDay ? "EEE, d MMM yyyy" : "EEE, d MMM · HH:mm")}
                </Text>
              </Pressable>
            </View>
          </Field>

          <Field label="Ends" error={rangeError ?? undefined}>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setPicker("end-date")}
                className="h-12 flex-1 flex-row items-center gap-2 rounded-xl bg-surface px-4"
                style={{ borderWidth: 1, borderColor: colors.border }}
              >
                <CalendarIcon size={16} color={colors.mutedForeground} />
                <Text style={{ color: colors.foreground, fontSize: 15 }}>
                  {format(endsAt, allDay ? "EEE, d MMM yyyy" : "EEE, d MMM · HH:mm")}
                </Text>
              </Pressable>
            </View>
          </Field>

          <Field label="Location">
            <Input
              value={location}
              onChangeText={setLocation}
              placeholder="Optional"
            />
          </Field>

          <Field label="Notes">
            <Input
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Details, agenda, link…"
              style={{ height: 96, textAlignVertical: "top", paddingTop: 12 }}
            />
          </Field>
        </ScrollView>

        <View className="border-t border-border bg-surface px-5 py-3">
          <PrimaryButton
            label={submitting ? "Saving…" : editing ? "Save changes" : "Add event"}
            loading={submitting}
            onPress={submit}
          />
        </View>

        {picker === "start-date" ? (
          <DateTimePicker
            value={startsAt}
            mode="date"
            onChange={(evt, s) => onPickerChange("start-date", evt, s)}
          />
        ) : null}
        {picker === "start-time" ? (
          <DateTimePicker
            value={startsAt}
            mode="time"
            is24Hour
            onChange={(evt, s) => onPickerChange("start-time", evt, s)}
          />
        ) : null}
        {picker === "end-date" ? (
          <DateTimePicker
            value={endsAt}
            mode="date"
            onChange={(evt, s) => onPickerChange("end-date", evt, s)}
          />
        ) : null}
        {picker === "end-time" ? (
          <DateTimePicker
            value={endsAt}
            mode="time"
            is24Hour
            onChange={(evt, s) => onPickerChange("end-time", evt, s)}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
