import { Text, View } from "react-native";
import { formatMoney } from "@lio/core/utils/currency";
import type { BudgetTransactionRow } from "../hooks/useBudget";
import { useThemeColors } from "@/providers/ThemeProvider";

interface Props {
  transactions: BudgetTransactionRow[];
  currency?: string;
}

function sumByKind(txs: BudgetTransactionRow[], kind: "income" | "expense" | "savings") {
  return txs.filter((t) => t.category?.kind === kind).reduce((sum, t) => sum + t.amount_cents, 0);
}

export function SummaryCards({ transactions, currency = "KES" }: Props) {
  const colors = useThemeColors();
  const income = sumByKind(transactions, "income");
  const expense = sumByKind(transactions, "expense");
  const savings = sumByKind(transactions, "savings");
  const net = income - expense - savings;

  const items: { label: string; value: number; color: string }[] = [
    { label: "Income", value: income, color: "#10b981" },
    { label: "Expenses", value: expense, color: "#ef4444" },
    { label: "Savings", value: savings, color: "#6366f1" },
    { label: "Net", value: net, color: net >= 0 ? colors.foreground : "#ef4444" },
  ];

  return (
    <View className="flex-row flex-wrap gap-3">
      {items.map((it) => (
        <View
          key={it.label}
          className="rounded-xl bg-surface p-4"
          style={{ borderWidth: 1, borderColor: colors.border, flex: 1, minWidth: 140 }}
        >
          <Text style={{ color: colors.mutedForeground, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {it.label}
          </Text>
          <Text style={{ marginTop: 4, color: it.color, fontSize: 18, fontWeight: "700" }}>
            {formatMoney(it.value, currency)}
          </Text>
        </View>
      ))}
    </View>
  );
}
