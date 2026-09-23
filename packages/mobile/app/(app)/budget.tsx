import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight, Plus, Settings2, Trash2 } from "lucide-react-native";
import { formatMoney } from "@lio/core/utils/currency";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/features/tasks/components/ConfirmDialog";
import { SummaryCards } from "@/features/budget/components/SummaryCards";
import { CategoryPie } from "@/features/budget/components/CategoryPie";
import { TransactionFormModal } from "@/features/budget/components/TransactionFormModal";
import { ManageCategoriesModal } from "@/features/budget/components/ManageCategoriesModal";
import {
  useCategories,
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
  type BudgetTransactionRow,
} from "@/features/budget/hooks/useBudget";
import { useThemeColors } from "@/providers/ThemeProvider";

const CURRENCY = "KES";
const isoDate = (d: Date) => format(d, "yyyy-MM-dd");

const KIND_COLOR: Record<string, string> = { income: "#10b981", expense: "#ef4444", savings: "#6366f1" };

type Row =
  | { kind: "summary" }
  | { kind: "pies" }
  | { kind: "list-header" }
  | { kind: "tx"; tx: BudgetTransactionRow };

export default function BudgetScreen() {
  const colors = useThemeColors();
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<BudgetTransactionRow | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<BudgetTransactionRow | null>(null);

  const range = useMemo(
    () => ({ from: isoDate(startOfMonth(cursor)), to: isoDate(endOfMonth(cursor)) }),
    [cursor],
  );

  const txQ = useTransactions(range.from, range.to);
  const categoriesQ = useCategories();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const transactions = txQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [{ kind: "summary" }, { kind: "pies" }, { kind: "list-header" }];
    for (const t of transactions) out.push({ kind: "tx", tx: t });
    return out;
  }, [transactions]);

  const openCreate = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditing(null);
    setFormVisible(true);
  };
  const openEdit = (t: BudgetTransactionRow) => {
    setEditing(t);
    setFormVisible(true);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScreenHeader
        title="Budget"
        subtitle="Track income, expenses, savings."
        right={
          <Pressable
            onPress={() => setManageOpen(true)}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "#eef2ff" }}
            accessibilityLabel="Manage categories"
          >
            <Settings2 size={16} color="#4338ca" />
          </Pressable>
        }
      />

      <View className="px-5 pb-2">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setCursor(addMonths(cursor, -1))}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            style={{ borderWidth: 1, borderColor: colors.border }}
          >
            <ChevronLeft size={16} color={colors.foreground2} />
          </Pressable>
          <View className="flex-1 items-center">
            <Text className="text-[15px] font-semibold text-foreground">{format(cursor, "MMMM yyyy")}</Text>
          </View>
          <Pressable
            onPress={() => setCursor(addMonths(cursor, 1))}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface"
            style={{ borderWidth: 1, borderColor: colors.border }}
          >
            <ChevronRight size={16} color={colors.foreground2} />
          </Pressable>
          <Pressable
            onPress={() => setCursor(new Date())}
            className="h-10 items-center justify-center rounded-full px-4"
            style={{ backgroundColor: "#eef2ff" }}
          >
            <Text style={{ color: "#4338ca", fontSize: 13, fontWeight: "600" }}>This month</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r, i) => (r.kind === "tx" ? r.tx.id : `s-${r.kind}-${i}`)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140, gap: 12 }}
        ListEmptyComponent={
          txQ.isLoading ? (
            <Text className="mt-8 text-center text-sm text-muted-foreground">Loading…</Text>
          ) : (
            <View className="mt-4">
              <EmptyState
                emoji="💰"
                title="No transactions this month"
                subtitle="Add your first income or expense to see summaries + charts."
                ctaLabel="Add transaction"
                onCta={openCreate}
              />
            </View>
          )
        }
        renderItem={({ item }) => {
          if (item.kind === "summary") {
            return <SummaryCards transactions={transactions} currency={CURRENCY} />;
          }
          if (item.kind === "pies") {
            return (
              <View className="gap-3">
                <CategoryPie title="Expenses by category" transactions={transactions} kind="expense" currency={CURRENCY} />
                <CategoryPie title="Income by category" transactions={transactions} kind="income" currency={CURRENCY} />
              </View>
            );
          }
          if (item.kind === "list-header") {
            return (
              <View className="mt-2 flex-row items-center gap-2">
                <Text className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Transactions
                </Text>
                <Text className="text-[12px] font-medium text-muted-foreground">· {transactions.length}</Text>
              </View>
            );
          }
          return <TxRow tx={item.tx} onEdit={openEdit} onDelete={setConfirmDelete} />;
        }}
      />

      <Pressable
        onPress={openCreate}
        className="absolute bottom-6 right-6 h-16 w-16 items-center justify-center rounded-full"
        style={{
          backgroundColor: "#6366f1",
          shadowColor: "#6366f1",
          shadowOpacity: 0.45,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
        accessibilityLabel="New transaction"
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>

      <TransactionFormModal
        visible={formVisible}
        editing={editing}
        categories={categories}
        submitting={createTx.isPending || updateTx.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={async (values) => {
          if (editing) {
            await updateTx.mutateAsync({ id: editing.id, patch: values });
          } else {
            await createTx.mutateAsync(values);
          }
          setFormVisible(false);
        }}
      />

      <ManageCategoriesModal
        visible={manageOpen}
        categories={categories}
        onClose={() => setManageOpen(false)}
      />

      <ConfirmDialog
        visible={!!confirmDelete}
        title="Delete transaction?"
        description={
          confirmDelete
            ? `${formatMoney(confirmDelete.amount_cents, confirmDelete.currency)} on ${format(new Date(confirmDelete.occurred_on + "T00:00:00"), "d MMM")} will be removed.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        pending={deleteTx.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteTx.mutateAsync(confirmDelete.id);
          setConfirmDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

function TxRow({
  tx,
  onEdit,
  onDelete,
}: {
  tx: BudgetTransactionRow;
  onEdit: (t: BudgetTransactionRow) => void;
  onDelete: (t: BudgetTransactionRow) => void;
}) {
  const colors = useThemeColors();
  const kind = tx.category?.kind;
  const kindColor = kind ? KIND_COLOR[kind]! : colors.mutedForeground;
  const sign = kind === "income" ? "+" : "−";
  return (
    <Pressable
      onPress={() => onEdit(tx)}
      className="flex-row items-center gap-3 rounded-xl bg-surface p-4"
      style={{ borderWidth: 1, borderColor: colors.border }}
    >
      <View style={{ width: 3, height: 32, backgroundColor: kindColor, borderRadius: 2 }} />
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text numberOfLines={1} style={{ flex: 1, color: colors.foreground, fontSize: 14, fontWeight: "600" }}>
            {tx.category?.name ?? "Uncategorized"}
          </Text>
          <Text style={{ color: kindColor, fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
            {sign}
            {formatMoney(tx.amount_cents, tx.currency)}
          </Text>
        </View>
        <Text style={{ marginTop: 2, color: colors.mutedForeground, fontSize: 12 }}>
          {format(new Date(tx.occurred_on + "T00:00:00"), "EEE, d MMM")}
          {tx.note ? ` · ${tx.note}` : ""}
        </Text>
      </View>
      <Pressable
        onPress={() => onDelete(tx)}
        hitSlop={6}
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.destructiveSoft }}
      >
        <Trash2 size={14} color="#ef4444" />
      </Pressable>
    </Pressable>
  );
}
