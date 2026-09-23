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
import { unitsToCents, centsToUnits } from "@lio/core/utils/currency";
import type { BudgetTransactionInput } from "@lio/core/schemas/budget";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import type { BudgetCategoryRow, BudgetTransactionRow } from "../hooks/useBudget";
import { useThemeColors } from "@/providers/ThemeProvider";

interface Props {
  visible: boolean;
  editing: BudgetTransactionRow | null;
  categories: BudgetCategoryRow[];
  onClose: () => void;
  onSubmit: (values: BudgetTransactionInput) => Promise<void> | void;
  submitting?: boolean;
}

const KIND_LABEL: Record<BudgetCategoryRow["kind"], string> = {
  income: "Income",
  expense: "Expenses",
  savings: "Savings",
};
const KIND_ORDER: BudgetCategoryRow["kind"][] = ["income", "expense", "savings"];

export function TransactionFormModal({ visible, editing, categories, onClose, onSubmit, submitting }: Props) {
  const colors = useThemeColors();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [occurredOn, setOccurredOn] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setAmount(editing ? String(centsToUnits(editing.amount_cents)) : "");
    setCategoryId(editing?.category_id ?? null);
    setOccurredOn(editing ? new Date(editing.occurred_on + "T00:00:00") : new Date());
    setNote(editing?.note ?? "");
    setAmountError(null);
    setShowPicker(false);
  }, [visible, editing]);

  const submit = async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setAmountError("Enter a positive amount");
      return;
    }
    await onSubmit({
      amount_cents: unitsToCents(parsed),
      category_id: categoryId,
      currency: "KES",
      occurred_on: format(occurredOn, "yyyy-MM-dd"),
      note: note.trim() || undefined,
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
            {editing ? "Edit transaction" : "New transaction"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }}>
          <Field label="Amount (KES)" error={amountError ?? undefined}>
            <Input
              value={amount}
              onChangeText={(v) => {
                setAmount(v);
                if (amountError) setAmountError(null);
              }}
              keyboardType="decimal-pad"
              placeholder="e.g. 1500.00"
              autoFocus
            />
          </Field>

          <Field label="Category">
            {categories.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                No categories yet. Create one first via "Manage categories".
              </Text>
            ) : (
              <View className="gap-3">
                {KIND_ORDER.map((k) => {
                  const cats = categories.filter((c) => c.kind === k);
                  if (cats.length === 0) return null;
                  return (
                    <View key={k} className="gap-1.5">
                      <Text style={{ color: colors.mutedForeground, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {KIND_LABEL[k]}
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                        {cats.map((c) => {
                          const active = categoryId === c.id;
                          const colour = c.color ?? "#6366f1";
                          return (
                            <Pressable
                              key={c.id}
                              onPress={() => setCategoryId(active ? null : c.id)}
                              className="rounded-full px-3.5 py-2"
                              style={{
                                borderWidth: 1,
                                borderColor: active ? colour : colors.border,
                                backgroundColor: active ? colour + "22" : colors.surface,
                              }}
                            >
                              <Text style={{ color: active ? colour : colors.mutedForeground, fontSize: 13, fontWeight: "500" }}>
                                {c.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  );
                })}
              </View>
            )}
          </Field>

          <Field label="Date">
            <Pressable
              onPress={() => setShowPicker(true)}
              className="h-12 flex-row items-center gap-2 rounded-xl bg-surface px-4"
              style={{ borderWidth: 1, borderColor: colors.border }}
            >
              <CalendarIcon size={16} color={colors.mutedForeground} />
              <Text style={{ color: colors.foreground, fontSize: 15 }}>{format(occurredOn, "EEE, d MMM yyyy")}</Text>
            </Pressable>
          </Field>

          <Field label="Note">
            <Input
              value={note}
              onChangeText={setNote}
              placeholder="Optional"
              multiline
              style={{ height: 72, textAlignVertical: "top", paddingTop: 12 }}
            />
          </Field>
        </ScrollView>

        <View className="border-t border-border bg-surface px-5 py-3">
          <PrimaryButton
            label={submitting ? "Saving…" : editing ? "Save changes" : "Add transaction"}
            loading={submitting}
            onPress={submit}
          />
        </View>

        {showPicker ? (
          <DateTimePicker
            value={occurredOn}
            mode="date"
            onChange={(evt, s) => {
              setShowPicker(false);
              if (evt.type === "set" && s) setOccurredOn(s);
            }}
          />
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}
