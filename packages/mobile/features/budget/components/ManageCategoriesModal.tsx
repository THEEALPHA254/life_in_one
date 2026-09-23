import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Plus, Trash2, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ConfirmDialog } from "@/features/tasks/components/ConfirmDialog";
import {
  useCreateCategory,
  useDeleteCategory,
  type BudgetCategoryRow,
} from "../hooks/useBudget";
import { useThemeColors } from "@/providers/ThemeProvider";

interface Props {
  visible: boolean;
  categories: BudgetCategoryRow[];
  onClose: () => void;
}

const KINDS: { value: BudgetCategoryRow["kind"]; label: string; color: string }[] = [
  { value: "income", label: "Income", color: "#10b981" },
  { value: "expense", label: "Expense", color: "#ef4444" },
  { value: "savings", label: "Savings", color: "#6366f1" },
];

export function ManageCategoriesModal({ visible, categories, onClose }: Props) {
  const colors = useThemeColors();
  const create = useCreateCategory();
  const del = useDeleteCategory();

  const [name, setName] = useState("");
  const [kind, setKind] = useState<BudgetCategoryRow["kind"]>("expense");
  const [confirmDelete, setConfirmDelete] = useState<BudgetCategoryRow | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    await create.mutateAsync({ name: name.trim(), kind });
    setName("");
    setNameError(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-row items-center gap-3 border-b border-border bg-surface px-5 py-4">
          <Pressable onPress={onClose} hitSlop={8} className="h-9 w-9 items-center justify-center rounded-full bg-muted">
            <X size={18} color={colors.foreground2} />
          </Pressable>
          <Text className="flex-1 text-[17px] font-semibold text-foreground">Manage categories</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 120 }}>
          <View className="gap-3 rounded-xl bg-surface p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
            <Field label="Name" error={nameError ?? undefined}>
              <Input
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g. Groceries"
              />
            </Field>
            <Field label="Kind">
              <View className="flex-row gap-2">
                {KINDS.map((k) => {
                  const active = kind === k.value;
                  return (
                    <Pressable
                      key={k.value}
                      onPress={() => setKind(k.value)}
                      className="flex-1 items-center rounded-xl py-2.5"
                      style={{
                        borderWidth: 1,
                        borderColor: active ? k.color : colors.border,
                        backgroundColor: active ? k.color + "18" : colors.surface,
                      }}
                    >
                      <Text style={{ color: active ? k.color : colors.mutedForeground, fontSize: 13, fontWeight: active ? "600" : "500" }}>
                        {k.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>
            <PrimaryButton
              label={create.isPending ? "Adding…" : "Add category"}
              loading={create.isPending}
              onPress={submit}
              leading={<Plus size={16} color="#fff" />}
            />
          </View>

          <View className="gap-2">
            <Text className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Existing</Text>
            {categories.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>No categories yet.</Text>
            ) : (
              <View className="gap-2">
                {KINDS.map((k) => {
                  const items = categories.filter((c) => c.kind === k.value);
                  if (items.length === 0) return null;
                  return (
                    <View key={k.value} className="rounded-xl bg-surface p-3" style={{ borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ color: k.color, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {k.label}
                      </Text>
                      <View className="mt-2 gap-1">
                        {items.map((c) => (
                          <View key={c.id} className="flex-row items-center gap-2 py-1.5">
                            <Text style={{ flex: 1, color: colors.foreground, fontSize: 14 }}>{c.name}</Text>
                            <Pressable
                              onPress={() => setConfirmDelete(c)}
                              hitSlop={6}
                              className="h-8 w-8 items-center justify-center rounded-full"
                              style={{ backgroundColor: colors.destructiveSoft }}
                            >
                              <Trash2 size={14} color="#ef4444" />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        <ConfirmDialog
          visible={!!confirmDelete}
          title="Delete category?"
          description={
            confirmDelete
              ? `"${confirmDelete.name}" will be removed. Existing transactions become "Uncategorized".`
              : undefined
          }
          confirmLabel="Delete"
          destructive
          pending={del.isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            if (!confirmDelete) return;
            await del.mutateAsync(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
