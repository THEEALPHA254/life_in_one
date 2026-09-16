import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { formatMoney } from "@lio/core/utils/currency";
import { useTransactions } from "@/features/budget/hooks/useBudget";
import { WidgetCard, WidgetEmpty } from "./WidgetCard";
import { cn } from "@/lib/utils";

const CURRENCY = "KES";

export function BudgetWidget() {
  const now = new Date();
  const from = format(startOfMonth(now), "yyyy-MM-dd");
  const to = format(endOfMonth(now), "yyyy-MM-dd");
  const q = useTransactions(from, to);
  const rows = q.data ?? [];

  const stats = useMemo(() => {
    let income = 0, expense = 0, savings = 0;
    for (const t of rows) {
      const k = t.category?.kind ?? "expense";
      if (k === "income") income += t.amount_cents;
      else if (k === "expense") expense += t.amount_cents;
      else if (k === "savings") savings += t.amount_cents;
    }
    return { income, expense, savings, net: income - expense - savings };
  }, [rows]);

  return (
    <WidgetCard to="/budget" title="Budget" icon={Wallet}>
      {rows.length === 0 ? (
        <WidgetEmpty text="No transactions this month." />
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <p className={cn("text-2xl font-semibold tabular-nums", stats.net < 0 && "text-destructive")}>
              {formatMoney(stats.net, CURRENCY)}
            </p>
            <p className="text-xs text-muted-foreground">net · {format(now, "LLLL")}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <p className="text-muted-foreground">Income</p>
              <p className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">{formatMoney(stats.income, CURRENCY)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Spent</p>
              <p className="font-medium text-destructive tabular-nums">{formatMoney(stats.expense, CURRENCY)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Saved</p>
              <p className="font-medium text-primary tabular-nums">{formatMoney(stats.savings, CURRENCY)}</p>
            </div>
          </div>
        </>
      )}
    </WidgetCard>
  );
}
