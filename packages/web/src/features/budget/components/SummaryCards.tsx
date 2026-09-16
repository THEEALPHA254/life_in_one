import { formatMoney } from "@lio/core/utils/currency";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BudgetTransactionRow } from "../hooks/useBudget";

interface Props {
  transactions: BudgetTransactionRow[];
  currency?: string;
}

function sumByKind(txs: BudgetTransactionRow[], kind: "income" | "expense" | "savings") {
  return txs.filter((t) => t.category?.kind === kind).reduce((sum, t) => sum + t.amount_cents, 0);
}

export function SummaryCards({ transactions, currency = "KES" }: Props) {
  const income = sumByKind(transactions, "income");
  const expense = sumByKind(transactions, "expense");
  const savings = sumByKind(transactions, "savings");
  const net = income - expense - savings;

  const items = [
    { label: "Income", value: income, className: "text-emerald-600 dark:text-emerald-400" },
    { label: "Expenses", value: expense, className: "text-destructive" },
    { label: "Savings", value: savings, className: "text-primary" },
    { label: "Net", value: net, className: net >= 0 ? "text-foreground" : "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label}>
          <CardContent className="space-y-1 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{it.label}</p>
            <p className={cn("text-xl font-semibold tabular-nums md:text-2xl", it.className)}>
              {formatMoney(it.value, currency)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
