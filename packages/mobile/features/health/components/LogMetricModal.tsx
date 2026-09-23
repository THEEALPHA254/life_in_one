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
import type { HealthMetricInput } from "@lio/core/schemas/health";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { PREDEFINED_TYPES, configFor } from "../metric-config";
import { useThemeColors } from "@/providers/ThemeProvider";

interface Props {
  visible: boolean;
  defaultType?: string;
  existingCustomTypes: string[];
  onClose: () => void;
  onSubmit: (values: HealthMetricInput) => Promise<void> | void;
  submitting?: boolean;
}

export function LogMetricModal({
  visible,
  defaultType,
  existingCustomTypes,
  onClose,
  onSubmit,
  submitting,
}: Props) {
  const colors = useThemeColors();
  const [metricType, setMetricType] = useState<string>(defaultType ?? PREDEFINED_TYPES[0]!);
  const [customEditing, setCustomEditing] = useState(false);
  const [customType, setCustomType] = useState("");
  const [value, setValue] = useState("");
  const [recordedAt, setRecordedAt] = useState<Date>(new Date());
  const [picker, setPicker] = useState<null | "date" | "time">(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMetricType(defaultType ?? PREDEFINED_TYPES[0]!);
    setCustomEditing(false);
    setCustomType("");
    setValue("");
    setRecordedAt(new Date());
    setValueError(null);
    setTypeError(null);
    setPicker(null);
  }, [visible, defaultType]);

  const allCustom = Array.from(new Set(existingCustomTypes.filter((t) => !PREDEFINED_TYPES.includes(t))));
  const config = configFor(customEditing && customType ? customType : metricType);

  const submit = async () => {
    const finalType = customEditing ? customType.trim().toLowerCase().replace(/\s+/g, "_") : metricType;
    if (!finalType) {
      setTypeError("Type is required");
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setValueError("Enter a number");
      return;
    }
    await onSubmit({
      metric_type: finalType,
      value: parsed,
      recorded_at: recordedAt.toISOString(),
      source: "manual",
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
          <Text className="flex-1 text-[17px] font-semibold text-foreground">Log metric</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }}>
          <Field label="Metric" error={typeError ?? undefined}>
            <View className="flex-row flex-wrap gap-2">
              {PREDEFINED_TYPES.map((t) => {
                const active = !customEditing && metricType === t;
                const c = configFor(t);
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      setMetricType(t);
                      setCustomEditing(false);
                    }}
                    className="rounded-full px-3.5 py-2"
                    style={{
                      borderWidth: 1,
                      borderColor: active ? "#6366f1" : colors.border,
                      backgroundColor: active ? "#eef2ff" : colors.surface,
                    }}
                  >
                    <Text style={{ color: active ? "#4338ca" : colors.mutedForeground, fontSize: 13, fontWeight: "500" }}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
              {allCustom.map((t) => {
                const active = !customEditing && metricType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      setMetricType(t);
                      setCustomEditing(false);
                    }}
                    className="rounded-full px-3.5 py-2"
                    style={{
                      borderWidth: 1,
                      borderColor: active ? "#6366f1" : colors.border,
                      backgroundColor: active ? "#eef2ff" : colors.surface,
                    }}
                  >
                    <Text style={{ color: active ? "#4338ca" : colors.mutedForeground, fontSize: 13, fontWeight: "500" }}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => {
                  setCustomEditing(true);
                  setTypeError(null);
                }}
                className="rounded-full px-3.5 py-2"
                style={{
                  borderWidth: 1,
                  borderColor: customEditing ? "#6366f1" : colors.border,
                  backgroundColor: customEditing ? "#eef2ff" : colors.surface,
                }}
              >
                <Text style={{ color: customEditing ? "#4338ca" : colors.mutedForeground, fontSize: 13, fontWeight: "500" }}>
                  Custom…
                </Text>
              </Pressable>
            </View>
            {customEditing ? (
              <Input
                value={customType}
                onChangeText={(v) => {
                  setCustomType(v);
                  if (typeError) setTypeError(null);
                }}
                placeholder="e.g. mood_score"
                autoCapitalize="none"
                autoCorrect={false}
              />
            ) : null}
          </Field>

          <Field label={config.unit ? `Value (${config.unit})` : "Value"} error={valueError ?? undefined}>
            <Input
              value={value}
              onChangeText={(v) => {
                setValue(v);
                if (valueError) setValueError(null);
              }}
              keyboardType="decimal-pad"
              placeholder={config.aggregation === "sum" ? "e.g. 7500" : "e.g. 72"}
              autoFocus
            />
          </Field>

          <Field label="When">
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setPicker("date")}
                className="h-12 flex-1 flex-row items-center gap-2 rounded-xl bg-surface px-4"
                style={{ borderWidth: 1, borderColor: colors.border }}
              >
                <CalendarIcon size={16} color={colors.mutedForeground} />
                <Text style={{ color: colors.foreground, fontSize: 15 }}>{format(recordedAt, "EEE, d MMM · HH:mm")}</Text>
              </Pressable>
            </View>
          </Field>
        </ScrollView>

        <View className="border-t border-border bg-surface px-5 py-3">
          <PrimaryButton
            label={submitting ? "Saving…" : "Log"}
            loading={submitting}
            onPress={submit}
          />
        </View>

        {picker === "date" ? (
          <DateTimePicker
            value={recordedAt}
            mode="date"
            onChange={(evt, s) => {
              setPicker(null);
              if (evt.type === "set" && s) {
                const merged = new Date(recordedAt);
                merged.setFullYear(s.getFullYear(), s.getMonth(), s.getDate());
                setRecordedAt(merged);
                setTimeout(() => setPicker("time"), 250);
              }
            }}
          />
        ) : null}
        {picker === "time" ? (
          <DateTimePicker
            value={recordedAt}
            mode="time"
            is24Hour
            onChange={(evt, s) => {
              setPicker(null);
              if (evt.type === "set" && s) {
                const merged = new Date(recordedAt);
                merged.setHours(s.getHours(), s.getMinutes(), 0, 0);
                setRecordedAt(merged);
              }
            }}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
