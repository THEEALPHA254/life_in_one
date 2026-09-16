import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatMoney } from "@lio/core/utils/currency";
import type { BudgetTransactionRow } from "../hooks/useBudget";

interface Props {
  transactions: BudgetTransactionRow[];
  kind: "expense" | "income" | "savings";
  currency?: string;
}

const fallbackPalette = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#8b5cf6", "#f97316", "#14b8a6"];

const kindLabel = { expense: "Expenses", income: "Income", savings: "Savings" } as const;

export function CategoryPie({ transactions, kind, currency = "KES" }: Props) {
  const slices = useMemo(() => {
    const grouped = new Map<string, { name: string; value: number; color: string }>();
    let uncategorized = 0;
    for (const t of transactions) {
      if (t.category?.kind !== kind) continue;
      if (!t.category) {
        uncategorized += t.amount_cents;
        continue;
      }
      const key = t.category.id;
      const current = grouped.get(key);
      const next = (current?.value ?? 0) + t.amount_cents;
      grouped.set(key, { name: t.category.name, value: next, color: t.category.color ?? "" });
    }
    const arr = Array.from(grouped.values());
    if (uncategorized > 0) arr.push({ name: "Uncategorized", value: uncategorized, color: "" });
    return arr
      .map((s, i) => ({ ...s, color: s.color || fallbackPalette[i % fallbackPalette.length]! }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, kind]);

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{kindLabel[kind]} by category</h3>
        <span className="text-xs text-muted-foreground">{formatMoney(total, currency)}</span>
      </div>
      {slices.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No {kindLabel[kind].toLowerCase()} this month.</p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                {slices.map((s, i) => (
                  <Cell key={`c-${i}`} fill={s.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatMoney(v, currency)} />
              <Legend verticalAlign="bottom" height={36} iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
