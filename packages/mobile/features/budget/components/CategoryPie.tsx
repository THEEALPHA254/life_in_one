import { useMemo } from "react";
import { Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { formatMoney } from "@lio/core/utils/currency";
import type { BudgetTransactionRow } from "../hooks/useBudget";
import { useThemeColors } from "@/providers/ThemeProvider";

// Fallback palette for categories without a color assigned.
const PALETTE = ["#6366f1", "#ef4444", "#10b981", "#f59e0b", "#3b82f6", "#a855f7", "#14b8a6", "#f97316"];

interface Props {
  title: string;
  transactions: BudgetTransactionRow[];
  kind: "income" | "expense" | "savings";
  currency?: string;
}

interface Slice {
  value: number;
  color: string;
  label: string;
}

export function CategoryPie({ title, transactions, kind, currency = "KES" }: Props) {
  const colors = useThemeColors();
  const { data, total } = useMemo(() => {
    const totals = new Map<string, { name: string; color: string | null; amount: number }>();
    for (const t of transactions) {
      if (t.category?.kind !== kind) continue;
      const key = t.category.id;
      const cur = totals.get(key) ?? { name: t.category.name, color: t.category.color, amount: 0 };
      cur.amount += t.amount_cents;
      totals.set(key, cur);
    }
    const arr = [...totals.values()].sort((a, b) => b.amount - a.amount);
    const total = arr.reduce((s, x) => s + x.amount, 0);
    const data: Slice[] = arr.map((x, i) => ({
      value: x.amount,
      color: x.color ?? PALETTE[i % PALETTE.length]!,
      label: x.name,
    }));
    return { data, total };
  }, [transactions, kind]);

  return (
    <View className="rounded-xl bg-surface p-4" style={{ borderWidth: 1, borderColor: colors.border }}>
      <Text className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </Text>
      {data.length === 0 ? (
        <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>No {kind} transactions this month.</Text>
      ) : (
        <View className="flex-row items-center gap-4">
          <PieChart
            data={data}
            radius={64}
            innerRadius={40}
            centerLabelComponent={() => (
              <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: "600", textAlign: "center" }}>
                {formatMoney(total, currency)}
              </Text>
            )}
          />
          <View className="flex-1 gap-1.5">
            {data.slice(0, 5).map((s) => (
              <View key={s.label} className="flex-row items-center gap-2">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                <Text numberOfLines={1} style={{ flex: 1, color: colors.foreground, fontSize: 12 }}>
                  {s.label}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, fontVariant: ["tabular-nums"] }}>
                  {formatMoney(s.value, currency)}
                </Text>
              </View>
            ))}
            {data.length > 5 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>+{data.length - 5} more</Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}
